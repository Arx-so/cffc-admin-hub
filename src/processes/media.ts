import { supabase } from "@/lib/supabase";
import type { MediaRowWithProfile, MediaStatus, MediaVideoWithSignedUrls } from "@/types/media";

export const MEDIA_BUCKET = "media";
const SIGNED_URL_EXPIRY_SEC = 3600;

export interface FetchVideoMediaResult {
  items: MediaVideoWithSignedUrls[];
  totalCount: number;
}

/** Create signed URLs for a media object's video/thumb storage paths (shared with Reports) */
export async function createSignedMediaUrls(
  url: string | null,
  thumbUrl: string | null
): Promise<{ signedVideoUrl: string | null; signedThumbUrl: string | null }> {
  let signedThumbUrl: string | null = null;
  let signedVideoUrl: string | null = null;

  if (thumbUrl) {
    const { data: thumbData } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(thumbUrl, SIGNED_URL_EXPIRY_SEC);
    signedThumbUrl = thumbData?.signedUrl ?? null;
  }

  if (url) {
    const { data: videoData } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(url, SIGNED_URL_EXPIRY_SEC);
    signedVideoUrl = videoData?.signedUrl ?? null;
  }

  return { signedVideoUrl, signedThumbUrl };
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
    .select(
      "id, athlete_user_id, url, thumb_url, title, status, created_at, auto_status, auto_flags, profile:athlete_user_id(name)",
      { count: "exact" }
    )
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
    const { signedVideoUrl, signedThumbUrl } = await createSignedMediaUrls(row.url, row.thumb_url);

    result.push({
      id: row.id,
      athlete_user_id: row.athlete_user_id,
      title: row.title,
      status: row.status,
      created_at: row.created_at,
      athleteName: row.profile?.name ?? "—",
      url: row.url,
      thumb_url: row.thumb_url,
      signedThumbUrl,
      signedVideoUrl,
      auto_status: row.auto_status,
      auto_flags: row.auto_flags ?? [],
    });
  }

  return { items: result, totalCount };
}

export async function updateMediaStatus(id: string, status: MediaStatus): Promise<void> {
  const { error } = await supabase.from("media").update({ status }).eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteMedia(params: {
  id: string;
  url: string;
  thumbUrl: string | null;
}): Promise<void> {
  const paths = [params.url, params.thumbUrl].filter((p): p is string => !!p);
  if (paths.length) {
    // Best-effort: a missing/already-removed file shouldn't block deleting the row.
    await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  }

  const { error } = await supabase.from("media").delete().eq("id", params.id);
  if (error) throw new Error(error.message);
}
