export type ReportStatus = "open" | "reviewed" | "actioned";

export type ReportReason =
  | "spam"
  | "nudity_or_violence"
  | "harassment_or_bullying"
  | "fake_profile"
  | "other";

export interface ReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  media_id: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface Report {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reportedUser: string;
  reportedUserId: string;
  reportedBy: string;
  hasMedia: boolean;
  mediaTitle: string | null;
  /** Only set when the reported media is a video, so the admin can watch it before judging the report */
  mediaSignedVideoUrl: string | null;
  mediaSignedThumbUrl: string | null;
  createdAt: string;
}
