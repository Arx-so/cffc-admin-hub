-- adm_logs: auditoria de ações de administradores
-- adm_id = admin que executou a ação; user_id = usuário alvo (quando aplicável)

CREATE TYPE "public"."adm_log_type" AS ENUM (
  'user_created',
  'user_updated',
  'user_banned',
  'user_validated',
  'user_deleted',
  'report_handled',
  'athlete_profile_updated',
  'other'
);

COMMENT ON TYPE "public"."adm_log_type" IS 'Tipos de ação registrados no log de administração.';

CREATE TABLE "public"."adm_logs" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "adm_id" uuid NOT NULL,
  "user_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "type" "public"."adm_log_type" NOT NULL,
  "metadata" jsonb DEFAULT '{}'
);

COMMENT ON TABLE "public"."adm_logs" IS 'Log de ações de administradores (quem fez o quê, quando e dados extras em metadata).';
COMMENT ON COLUMN "public"."adm_logs"."metadata" IS 'JSON com dados do que foi criado/alterado (payload da ação).';

ALTER TABLE "public"."adm_logs"
  ADD CONSTRAINT "adm_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."adm_logs"
  ADD CONSTRAINT "adm_logs_adm_id_fkey"
  FOREIGN KEY ("adm_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

ALTER TABLE "public"."adm_logs"
  ADD CONSTRAINT "adm_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE SET NULL;

CREATE INDEX "idx_adm_logs_adm_id" ON "public"."adm_logs" USING btree ("adm_id");
CREATE INDEX "idx_adm_logs_user_id" ON "public"."adm_logs" USING btree ("user_id");
CREATE INDEX "idx_adm_logs_created_at" ON "public"."adm_logs" USING btree ("created_at" DESC);
CREATE INDEX "idx_adm_logs_type" ON "public"."adm_logs" USING btree ("type");

ALTER TABLE "public"."adm_logs" ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler logs (ajuste a policy conforme sua checagem de role)
CREATE POLICY "adm_logs_select_admin"
  ON "public"."adm_logs"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."profile" p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Apenas admins ou service_role podem inserir (backend usa service_role)
CREATE POLICY "adm_logs_insert_admin"
  ON "public"."adm_logs"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."profile" p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

GRANT ALL ON "public"."adm_logs" TO "service_role";
GRANT SELECT, INSERT ON "public"."adm_logs" TO "authenticated";
