-- AthleteProfile: dados extras do perfil atleta (1 por usuário com role athlete)
-- user_id referencia profile.id (e auth.users)

CREATE TABLE "public"."athlete_profile" (
  "user_id" uuid NOT NULL,
  "height" integer,
  "weight" numeric(5, 2),
  "dominant_foot" text,
  "positions" text[] DEFAULT '{}',
  "strengths" text[] DEFAULT '{}',
  "current_category" text,
  "availability" text,
  "club_history" jsonb DEFAULT '[]',
  "is_searchable" boolean NOT NULL DEFAULT true,
  "contact_visibility" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE "public"."athlete_profile" IS 'Perfil atleta: altura, peso, posições, histórico de clubes, etc. Um por usuário atleta.';
COMMENT ON COLUMN "public"."athlete_profile"."club_history" IS 'Array de { club, category, start, end }';

ALTER TABLE "public"."athlete_profile"
  ADD CONSTRAINT "athlete_profile_pkey" PRIMARY KEY ("user_id");

ALTER TABLE "public"."athlete_profile"
  ADD CONSTRAINT "athlete_profile_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

CREATE INDEX "idx_athlete_profile_is_searchable" ON "public"."athlete_profile" USING btree ("is_searchable");
CREATE INDEX "idx_athlete_profile_current_category" ON "public"."athlete_profile" USING btree ("current_category");

ALTER TABLE "public"."athlete_profile" ENABLE ROW LEVEL SECURITY;

-- Leitura: autenticados podem ler (listagens, shortlist, contato)
CREATE POLICY "athlete_profile_select"
  ON "public"."athlete_profile"
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserir/atualizar: só o próprio atleta
CREATE POLICY "athlete_profile_insert_own"
  ON "public"."athlete_profile"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "athlete_profile_update_own"
  ON "public"."athlete_profile"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON "public"."athlete_profile" TO "authenticated";
GRANT ALL ON "public"."athlete_profile" TO "service_role";
