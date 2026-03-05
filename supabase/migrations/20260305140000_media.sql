-- Media: arquivos do atleta (documento, imagem, vídeo)
-- athlete_user_id referencia profile.id (dono do arquivo)

CREATE TYPE "public"."media_type" AS ENUM ('document', 'image', 'video');

-- Reutiliza o mesmo enum de status de aprovação já usado em professional_document
CREATE TABLE "public"."media" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "athlete_user_id" uuid NOT NULL,
  "type" "public"."media_type" NOT NULL,
  "url" text NOT NULL,
  "size" bigint,
  "thumb_url" text,
  "title" text,
  "status" "public"."professional_document_status" NOT NULL DEFAULT 'pending',
  "link" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE "public"."media" IS 'Mídia do atleta: documentos, imagens e vídeos.';

ALTER TABLE "public"."media"
  ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."media"
  ADD CONSTRAINT "media_athlete_user_id_fkey"
  FOREIGN KEY ("athlete_user_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

CREATE INDEX "idx_media_athlete_user_id" ON "public"."media" USING btree ("athlete_user_id");
CREATE INDEX "idx_media_created_at" ON "public"."media" USING btree ("created_at");
CREATE INDEX "idx_media_status" ON "public"."media" USING btree ("status");
CREATE INDEX "idx_media_type" ON "public"."media" USING btree ("type");

ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;

-- Leitura: autenticados podem ler
CREATE POLICY "media_select"
  ON "public"."media"
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserir: só o próprio atleta
CREATE POLICY "media_insert_own"
  ON "public"."media"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = athlete_user_id);

-- Atualizar: só o dono
CREATE POLICY "media_update_own"
  ON "public"."media"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = athlete_user_id)
  WITH CHECK (auth.uid() = athlete_user_id);

-- Deletar: só o dono
CREATE POLICY "media_delete_own"
  ON "public"."media"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = athlete_user_id);

GRANT ALL ON "public"."media" TO "authenticated";
GRANT ALL ON "public"."media" TO "service_role";
