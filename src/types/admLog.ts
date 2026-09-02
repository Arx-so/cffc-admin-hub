/** Enum values for adm_logs.type - must match Supabase adm_log_type */
export type AdmLogType =
  | "user_created"
  | "user_updated"
  | "user_banned"
  | "user_unbanned"
  | "user_validated"
  | "user_validation_removed"
  | "professional_document_approved"
  | "professional_document_rejected"
  | "user_deleted"
  | "report_handled"
  | "athlete_profile_updated"
  | "media_approved"
  | "media_rejected"
  | "media_deleted"
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
