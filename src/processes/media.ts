import { supabase } from "@/lib/supabase";
import type { MediaRowWithProfile, MediaStatus, MediaVideoWithSignedUrls } from "@/types/media";

const BUCKET = "media";
const SIGNED_URL_EXPIRY_SEC = 3600;

export interface FetchVideoMediaResult {
  items: MediaVideoWithSignedUrls[];
  totalCount: number;
}

/** Fetch videos by status, paginated */
export async function fetchVideoMediaByStatus(
  page: number,
  pageSize: number,
  status: MediaStatus
): Promise<FetchVideoMediaResult> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data: rows, error, count } = await supabase
    .from("media")
    .select("id, athlete_user_id, url, thumb_url, title, status, created_at, profile:athlete_user_id(name)", {
      count: "exact",
    })
    .eq("type", "video")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  const totalCount = count ?? 0;
  if (!rows?.length) return { items: [], totalCount };

  const typedRows = rows as unknown as MediaRowWithProfile[];
  const result: MediaVideoWithSignedUrls[] = [];

  for (const row of typedRows) {
    let signedThumbUrl: string | null = null;
    let signedVideoUrl: string | null = null;

    if (row.thumb_url) {
      const { data: thumbData } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.thumb_url, SIGNED_URL_EXPIRY_SEC);
      signedThumbUrl = thumbData?.signedUrl ?? null;
    }

    if (row.url) {
      const { data: videoData } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.url, SIGNED_URL_EXPIRY_SEC);
      signedVideoUrl = videoData?.signedUrl ?? null;
    }

    result.push({
      id: row.id,
      athlete_user_id: row.athlete_user_id,
      title: row.title,
      status: row.status,
      created_at: row.created_at,
      athleteName: row.profile?.name ?? "—",
      signedThumbUrl,
      signedVideoUrl,
    });
  }

  return { items: result, totalCount };
}

export async function updateMediaStatus(id: string, status: MediaStatus): Promise<void> {
  const { error } = await supabase.from("media").update({ status }).eq("id", id);

  if (error) throw new Error(error.message);
}
