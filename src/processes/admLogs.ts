import { supabase } from "@/lib/supabase";
import type { AdmLogRow, AdmLogWithNames, InsertAdmLogParams } from "@/types/admLog";

export type { AdmLogWithNames } from "@/types/admLog";

export async function insertAdmLog(params: InsertAdmLogParams): Promise<void> {
  const { admId, userId, type, metadata = {} } = params;
  const { error } = await supabase.from("adm_logs").insert({
    adm_id: admId,
    user_id: userId ?? null,
    type,
    metadata: Object.keys(metadata).length ? metadata : {},
  });
  if (error) throw new Error(error.message);
}

async function fetchAdmLogsWithNames(column: "adm_id" | "user_id", value: string): Promise<AdmLogWithNames[]> {
  const { data: logs, error } = await supabase
    .from("adm_logs")
    .select("id, adm_id, user_id, created_at, type, metadata")
    .eq(column, value)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (logs ?? []) as AdmLogRow[];

  if (rows.length === 0) return [];

  const profileIds = [...new Set([...rows.map((r) => r.adm_id), ...rows.map((r) => r.user_id).filter(Boolean)])] as string[];
  const { data: profiles } = await supabase.from("profile").select("id, name").in("id", profileIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.name ?? "—"]));

  return rows.map((r) => ({
    ...r,
    adm_name: nameById.get(r.adm_id) ?? null,
    user_name: r.user_id ? nameById.get(r.user_id) ?? null : null,
  }));
}

export async function fetchAdmLogsByUserId(userId: string): Promise<AdmLogWithNames[]> {
  return fetchAdmLogsWithNames("user_id", userId);
}

export async function fetchAdmLogsByAdmId(admId: string): Promise<AdmLogWithNames[]> {
  return fetchAdmLogsWithNames("adm_id", admId);
}
