-- ProfessionalDocument: documentos/imagens do profissional (profile pro)
-- media_id = id ou path do arquivo no storage; profile_id = dono do documento

CREATE TYPE "public"."professional_document_type" AS ENUM ('document', 'image');

CREATE TYPE "public"."professional_document_status" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "public"."professional_document" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "media_id" text NOT NULL,
  "type" "public"."professional_document_type" NOT NULL,
  "profile_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "status" "public"."professional_document_status" NOT NULL DEFAULT 'pending'
);

COMMENT ON TABLE "public"."professional_document" IS 'Documentos/imagens do perfil profissional (pro).';
COMMENT ON COLUMN "public"."professional_document"."media_id" IS 'ID ou path do arquivo no storage.';

ALTER TABLE "public"."professional_document"
  ADD CONSTRAINT "professional_document_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."professional_document"
  ADD CONSTRAINT "professional_document_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

CREATE INDEX "idx_professional_document_profile_id" ON "public"."professional_document" USING btree ("profile_id");
CREATE INDEX "idx_professional_document_created_at" ON "public"."professional_document" USING btree ("created_at");
CREATE INDEX "idx_professional_document_status" ON "public"."professional_document" USING btree ("status");

ALTER TABLE "public"."professional_document" ENABLE ROW LEVEL SECURITY;

-- Leitura: autenticados podem ler
CREATE POLICY "professional_document_select"
  ON "public"."professional_document"
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserir/atualizar: só o dono do perfil
CREATE POLICY "professional_document_insert_own"
  ON "public"."professional_document"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "professional_document_update_own"
  ON "public"."professional_document"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "professional_document_delete_own"
  ON "public"."professional_document"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

GRANT ALL ON "public"."professional_document" TO "authenticated";
GRANT ALL ON "public"."professional_document" TO "service_role";
