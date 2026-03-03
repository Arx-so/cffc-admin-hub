export type ReportStatus =
  | "pending"
  | "content_removed"
  | "user_blocked"
  | "rejected";

export type ReportTargetType = "video" | "profile" | "validation";

export interface ReportRow {
  id: string;
  reporter_user_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  created_at: string;
  status: ReportStatus;
}

export interface Report {
  id: string;
  type: ReportTargetType;
  reason: string;
  status: ReportStatus;
  reportedUser: string;
  reportedBy: string;
  createdAt: string;
}
