-- Report status: Portuguese enum values -> English
-- pendente -> pending, conteudo_removido -> content_removed,
-- usuario_bloqueado -> user_blocked, rejeitado -> rejected

CREATE TYPE "public"."report_status_new" AS ENUM (
  'pending',
  'content_removed',
  'user_blocked',
  'rejected'
);

ALTER TABLE "public"."report"
  ADD COLUMN "status_new" "public"."report_status_new";

UPDATE "public"."report"
SET "status_new" = CASE "status"::text
  WHEN 'pendente' THEN 'pending'::report_status_new
  WHEN 'conteudo_removido' THEN 'content_removed'::report_status_new
  WHEN 'usuario_bloqueado' THEN 'user_blocked'::report_status_new
  WHEN 'rejeitado' THEN 'rejected'::report_status_new
  ELSE 'pending'::report_status_new
END;

ALTER TABLE "public"."report" DROP COLUMN "status";
ALTER TABLE "public"."report" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "public"."report"
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'pending'::report_status_new;

DROP TYPE "public"."report_status";
ALTER TYPE "public"."report_status_new" RENAME TO "report_status";

-- Recreate index that referenced the column
DROP INDEX IF EXISTS "idx_report_status";
CREATE INDEX "idx_report_status" ON "public"."report" USING btree ("status");
