export type ReportStatus =
  | "pendente"
  | "conteudo_removido"
  | "usuario_bloqueado"
  | "rejeitado";

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
