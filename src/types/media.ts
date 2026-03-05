export type MediaType = "document" | "image" | "video";

export type MediaStatus = "pending" | "approved" | "rejected";

export interface Media {
  id: string;
  athlete_user_id: string;
  type: MediaType;
  url: string;
  size: number | null;
  thumb_url: string | null;
  title: string | null;
  status: MediaStatus;
  link: string | null;
  created_at: string;
}

/** Row from Supabase with profile join (profile.name from athlete_user_id) */
export interface MediaRowWithProfile {
  id: string;
  athlete_user_id: string;
  type: MediaType;
  url: string;
  size: number | null;
  thumb_url: string | null;
  title: string | null;
  status: MediaStatus;
  link: string | null;
  created_at: string;
  profile: { name: string | null } | null;
}

/** Video media item for list UI: DB fields + signed URLs + athlete name */
export interface MediaVideoWithSignedUrls {
  id: string;
  athlete_user_id: string;
  title: string | null;
  status: MediaStatus;
  created_at: string;
  athleteName: string;
  signedThumbUrl: string | null;
  signedVideoUrl: string | null;
}
