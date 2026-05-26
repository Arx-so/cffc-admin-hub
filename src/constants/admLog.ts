import type { AdmLogType } from "@/types/admLog";

/** PT labels for adm_log_type (modal and UI) */
export const ADM_LOG_TYPE_LABELS: Record<AdmLogType, string> = {
  user_created: "Usuário criado",
  user_updated: "Usuário atualizado",
  user_banned: "Usuário bloqueado",
  user_unbanned: "Usuário desbloqueado",
  user_validated: "Conta validada",
  user_validation_removed: "Validação removida",
  user_deleted: "Usuário eliminado",
  report_handled: "Denúncia tratada",
  athlete_profile_updated: "Perfil de atleta atualizado",
  professional_document_approved: "Documento profissional aprovado",
  professional_document_rejected: "Documento profissional rejeitado",
  media_approved: "Vídeo aprovado",
  media_rejected: "Vídeo rejeitado",
  other: "Outra ação",
};
