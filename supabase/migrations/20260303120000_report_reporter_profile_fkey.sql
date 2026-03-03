-- report.reporter_user_id: referenciar public.profile(id) em vez de auth.users(id)
-- Mantém consistência com as demais tabelas (validation, club_shortlist, etc.)

ALTER TABLE "public"."report"
  DROP CONSTRAINT IF EXISTS "report_reporter_user_id_fkey";

ALTER TABLE "public"."report"
  ADD CONSTRAINT "report_reporter_user_id_fkey"
  FOREIGN KEY ("reporter_user_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;
