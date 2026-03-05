-- Logs de aprovação/rejeição de documento profissional
ALTER TYPE "public"."adm_log_type" ADD VALUE 'professional_document_approved';
ALTER TYPE "public"."adm_log_type" ADD VALUE 'professional_document_rejected';
