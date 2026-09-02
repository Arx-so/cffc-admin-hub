/* eslint-disable @typescript-eslint/triple-slash-reference -- Edge Functions: Deno types from deno.d.ts */
/// <reference path="../deno.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  evaluate,
  RATE_LIMIT_WINDOW_HOURS,
  DUPLICATE_WINDOW_DAYS,
  type MediaRecord,
  type StorageObjectInfo,
  type UploadHistoryInfo,
} from "./rules.ts";

// Runs script-based (non-AI) checks on a newly uploaded video and either
// auto-approves it or leaves it pending with flags for the admin queue.
//
// Triggered by a Supabase Database Webhook (configured in the Dashboard, not
// in a migration) on INSERT into public.media. The webhook must send a
// `x-webhook-secret` header matching MEDIA_AUTO_MODERATE_SECRET.

const BUCKET = "media";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface DbWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: MediaRecord & { status: string };
  old_record: unknown;
}

function pathParts(path: string): { dir: string; filename: string } {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash < 0) return { dir: "", filename: path };
  return { dir: path.slice(0, lastSlash), filename: path.slice(lastSlash + 1) };
}

async function fetchStorageObjectInfo(
  supabase: ReturnType<typeof createClient>,
  path: string
): Promise<StorageObjectInfo> {
  const { dir, filename } = pathParts(path);
  const { data, error } = await supabase.storage.from(BUCKET).list(dir, {
    limit: 1,
    search: filename,
  });
  if (error || !data) return { found: false, size: null, mimetype: null };
  const obj = data.find((o) => o.name === filename);
  if (!obj) return { found: false, size: null, mimetype: null };
  const metadata = obj.metadata as { size?: number; mimetype?: string } | null;
  return {
    found: true,
    size: metadata?.size ?? null,
    mimetype: metadata?.mimetype ?? null,
  };
}

async function fetchUploadHistory(
  supabase: ReturnType<typeof createClient>,
  record: MediaRecord,
  storage: StorageObjectInfo
): Promise<UploadHistoryInfo> {
  const rateWindowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const duplicateWindowStart = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { count: uploadsInWindow } = await supabase
    .from("media")
    .select("id", { count: "exact", head: true })
    .eq("athlete_user_id", record.athlete_user_id)
    .eq("type", "video")
    .gte("created_at", rateWindowStart);

  let duplicateTitleFound = false;
  const title = (record.title ?? "").trim();
  if (title.length > 0) {
    const { count } = await supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("athlete_user_id", record.athlete_user_id)
      .eq("type", "video")
      .neq("id", record.id)
      .neq("status", "rejected")
      .eq("title", title)
      .gte("created_at", duplicateWindowStart);
    duplicateTitleFound = (count ?? 0) > 0;
  }

  let duplicateSizeFound = false;
  if (storage.size) {
    const { data: candidates } = await supabase
      .from("media")
      .select("id, url")
      .eq("athlete_user_id", record.athlete_user_id)
      .eq("type", "video")
      .neq("id", record.id)
      .neq("status", "rejected")
      .gte("created_at", duplicateWindowStart)
      .limit(20);
    for (const candidate of candidates ?? []) {
      const candidateInfo = await fetchStorageObjectInfo(supabase, candidate.url as string);
      if (candidateInfo.found && candidateInfo.size === storage.size) {
        duplicateSizeFound = true;
        break;
      }
    }
  }

  return {
    uploadsInWindow: uploadsInWindow ?? 0,
    duplicateTitleFound,
    duplicateSizeFound,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  const expectedSecret = Deno.env.get("MEDIA_AUTO_MODERATE_SECRET");
  const providedSecret = req.headers.get("x-webhook-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }

  let payload: DbWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ message: "Invalid JSON body" }, 400);
  }

  const { record } = payload;
  if (payload.table !== "media" || record?.type !== "video" || record?.status !== "pending") {
    // Not something we need to evaluate; ack so the webhook doesn't retry.
    return jsonResponse({ skipped: true }, 200);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) {
    return jsonResponse({ message: "Server configuration error" }, 500);
  }
  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

  const { data: settings } = await supabase
    .from("moderation_settings")
    .select("auto_moderation_enabled")
    .eq("id", 1)
    .single();

  if (settings?.auto_moderation_enabled === false) {
    const { error } = await supabase
      .from("media")
      .update({
        status: "approved",
        auto_status: "skipped",
        auto_flags: [],
        auto_checked_at: new Date().toISOString(),
      })
      .eq("id", record.id);
    if (error) return jsonResponse({ message: error.message }, 500);
    return jsonResponse({ decision: "skipped" }, 200);
  }

  const storage = await fetchStorageObjectInfo(supabase, record.url);
  const history = await fetchUploadHistory(supabase, record, storage);
  const flags = evaluate(record, storage, history);

  const nowIso = new Date().toISOString();
  if (flags.length === 0) {
    const { error } = await supabase
      .from("media")
      .update({ status: "approved", auto_status: "approved", auto_flags: [], auto_checked_at: nowIso })
      .eq("id", record.id);
    if (error) return jsonResponse({ message: error.message }, 500);
    return jsonResponse({ decision: "approved" }, 200);
  }

  const { error } = await supabase
    .from("media")
    .update({ auto_status: "flagged", auto_flags: flags, auto_checked_at: nowIso })
    .eq("id", record.id);
  if (error) return jsonResponse({ message: error.message }, 500);
  return jsonResponse({ decision: "flagged", flags }, 200);
});
