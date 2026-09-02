import { supabase } from "@/lib/supabase";
import { createSignedMediaUrls } from "@/processes/media";
import type { Report, ReportRow, ReportStatus } from "@/types/report";

const TABLE = "content_report";

interface ReportedMediaInfo {
  title: string | null;
  signedVideoUrl: string | null;
  signedThumbUrl: string | null;
}

async function fetchReportRows(status?: ReportStatus): Promise<ReportRow[]> {
  let q = supabase.from(TABLE).select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  return (rows ?? []) as ReportRow[];
}

async function fetchProfileNames(ids: string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map();
  const { data } = await supabase.from("profile").select("id, name").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p.name ?? "—"]));
}

async function fetchReportedMedia(ids: string[]): Promise<Map<string, ReportedMediaInfo>> {
  if (!ids.length) return new Map();
  const { data } = await supabase.from("media").select("id, title, type, url, thumb_url").in("id", ids);
  const result = new Map<string, ReportedMediaInfo>();
  for (const m of data ?? []) {
    // Only videos get a signed playback URL - other media types aren't playable here.
    const { signedVideoUrl, signedThumbUrl } =
      m.type === "video"
        ? await createSignedMediaUrls(m.url, m.thumb_url)
        : { signedVideoUrl: null, signedThumbUrl: null };
    result.set(m.id, { title: m.title, signedVideoUrl, signedThumbUrl });
  }
  return result;
}

async function mapRowsToReports(rows: ReportRow[]): Promise<Report[]> {
  if (!rows.length) return [];

  const profileIds = [
    ...new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id])),
  ];
  const mediaIds = [
    ...new Set(rows.map((r) => r.media_id).filter((id): id is string => id !== null)),
  ];

  const [nameById, mediaById] = await Promise.all([
    fetchProfileNames(profileIds),
    fetchReportedMedia(mediaIds),
  ]);

  return rows.map((r) => {
    const media = r.media_id ? mediaById.get(r.media_id) : undefined;
    return {
      id: r.id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      reportedUser: nameById.get(r.reported_user_id) ?? "—",
      reportedUserId: r.reported_user_id,
      reportedBy: nameById.get(r.reporter_id) ?? "—",
      hasMedia: r.media_id !== null,
      mediaTitle: media?.title ?? null,
      mediaSignedVideoUrl: media?.signedVideoUrl ?? null,
      mediaSignedThumbUrl: media?.signedThumbUrl ?? null,
      createdAt: formatDate(r.created_at),
    };
  });
}

export async function fetchReports(): Promise<Report[]> {
  return mapRowsToReports(await fetchReportRows());
}

export async function fetchReportsByStatus(status: ReportStatus): Promise<Report[]> {
  return mapRowsToReports(await fetchReportRows(status));
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus
): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ status }).eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) throw new Error(error.message);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
