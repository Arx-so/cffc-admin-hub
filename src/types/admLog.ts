/** Enum values for adm_logs.type - must match Supabase adm_log_type */
export type AdmLogType =
  | "user_created"
  | "user_updated"
  | "user_banned"
  | "user_unbanned"
  | "user_validated"
  | "user_validation_removed"
  | "user_deleted"
  | "report_handled"
  | "athlete_profile_updated"
  | "other";

export interface InsertAdmLogParams {
  admId: string;
  userId?: string | null;
  type: AdmLogType;
  metadata?: Record<string, unknown>;
}

export interface AdmLogRow {
  id: string;
  adm_id: string;
  user_id: string | null;
  created_at: string;
  type: AdmLogType;
  metadata: Record<string, unknown>;
}

export interface AdmLogWithNames extends AdmLogRow {
  adm_name: string | null;
  user_name: string | null;
}
