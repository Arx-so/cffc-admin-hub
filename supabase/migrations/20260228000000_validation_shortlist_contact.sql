-- Add guardian_email to profile (optional, for athletes)
ALTER TABLE "public"."profile"
  ADD COLUMN IF NOT EXISTS "guardian_email" text;

COMMENT ON COLUMN "public"."profile"."guardian_email" IS 'Email do responsável (para atletas menores).';

-- Validation: aprovação/rejeição de atleta por profissional
CREATE TYPE "public"."validation_status" AS ENUM ('approved', 'rejected');

CREATE TABLE "public"."validation" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "athlete_user_id" uuid NOT NULL,
  "professional_user_id" uuid NOT NULL,
  "professional_role" text,
  "registration_id" text,
  "checklist" jsonb NOT NULL DEFAULT '{}',
  "note" text,
  "status" "public"."validation_status" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE "public"."validation" IS 'Validação de atleta por profissional (pro). checklist: characteristicsOk, positionOk, videoCoherent, injuryHistoryFlag.';

ALTER TABLE "public"."validation"
  ADD CONSTRAINT "validation_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."validation"
  ADD CONSTRAINT "validation_athlete_user_id_fkey"
  FOREIGN KEY ("athlete_user_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

ALTER TABLE "public"."validation"
  ADD CONSTRAINT "validation_professional_user_id_fkey"
  FOREIGN KEY ("professional_user_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

CREATE INDEX "idx_validation_athlete" ON "public"."validation" USING btree ("athlete_user_id");
CREATE INDEX "idx_validation_professional" ON "public"."validation" USING btree ("professional_user_id");
CREATE INDEX "idx_validation_status" ON "public"."validation" USING btree ("status");
CREATE INDEX "idx_validation_created_at" ON "public"."validation" USING btree ("created_at");

ALTER TABLE "public"."validation" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON "public"."validation" TO "authenticated";
GRANT ALL ON "public"."validation" TO "service_role";

-- ClubShortlist: lista de atletas de interesse do clube
CREATE TABLE "public"."club_shortlist" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "club_user_id" uuid NOT NULL,
  "athlete_user_id" uuid NOT NULL,
  "tags" text[] NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE "public"."club_shortlist" IS 'Shortlist do clube: atletas de interesse com tags.';

ALTER TABLE "public"."club_shortlist"
  ADD CONSTRAINT "club_shortlist_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."club_shortlist"
  ADD CONSTRAINT "club_shortlist_club_user_id_fkey"
  FOREIGN KEY ("club_user_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

ALTER TABLE "public"."club_shortlist"
  ADD CONSTRAINT "club_shortlist_athlete_user_id_fkey"
  FOREIGN KEY ("athlete_user_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "idx_club_shortlist_unique" ON "public"."club_shortlist" ("club_user_id", "athlete_user_id");
CREATE INDEX "idx_club_shortlist_club" ON "public"."club_shortlist" USING btree ("club_user_id");
CREATE INDEX "idx_club_shortlist_athlete" ON "public"."club_shortlist" USING btree ("athlete_user_id");
CREATE INDEX "idx_club_shortlist_created_at" ON "public"."club_shortlist" USING btree ("created_at");

ALTER TABLE "public"."club_shortlist" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON "public"."club_shortlist" TO "authenticated";
GRANT ALL ON "public"."club_shortlist" TO "service_role";

-- ContactRequest: pedido de contato clube -> atleta
CREATE TYPE "public"."contact_request_status" AS ENUM ('pending', 'accepted', 'declined');

CREATE TYPE "public"."contact_request_accepted_by" AS ENUM ('athlete', 'guardian');

CREATE TABLE "public"."contact_request" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "club_user_id" uuid NOT NULL,
  "athlete_user_id" uuid NOT NULL,
  "status" "public"."contact_request_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "accepted_by" "public"."contact_request_accepted_by"
);

COMMENT ON TABLE "public"."contact_request" IS 'Pedido de contato do clube ao atleta; accepted_by preenchido quando status = accepted.';

ALTER TABLE "public"."contact_request"
  ADD CONSTRAINT "contact_request_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."contact_request"
  ADD CONSTRAINT "contact_request_club_user_id_fkey"
  FOREIGN KEY ("club_user_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

ALTER TABLE "public"."contact_request"
  ADD CONSTRAINT "contact_request_athlete_user_id_fkey"
  FOREIGN KEY ("athlete_user_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

CREATE INDEX "idx_contact_request_club" ON "public"."contact_request" USING btree ("club_user_id");
CREATE INDEX "idx_contact_request_athlete" ON "public"."contact_request" USING btree ("athlete_user_id");
CREATE INDEX "idx_contact_request_status" ON "public"."contact_request" USING btree ("status");
CREATE INDEX "idx_contact_request_created_at" ON "public"."contact_request" USING btree ("created_at");

ALTER TABLE "public"."contact_request" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON "public"."contact_request" TO "authenticated";
GRANT ALL ON "public"."contact_request" TO "service_role";

-- RLS: validation — leitura para autenticados; escrita para o profissional dono do registro
CREATE POLICY "validation_select"
  ON "public"."validation" FOR SELECT TO authenticated USING (true);

CREATE POLICY "validation_insert"
  ON "public"."validation" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = professional_user_id);

CREATE POLICY "validation_update"
  ON "public"."validation" FOR UPDATE TO authenticated
  USING (auth.uid() = professional_user_id)
  WITH CHECK (auth.uid() = professional_user_id);

-- RLS: club_shortlist — clube gerencia sua lista; atleta vê onde está
CREATE POLICY "club_shortlist_select"
  ON "public"."club_shortlist" FOR SELECT TO authenticated
  USING (auth.uid() = club_user_id OR auth.uid() = athlete_user_id);

CREATE POLICY "club_shortlist_insert"
  ON "public"."club_shortlist" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = club_user_id);

CREATE POLICY "club_shortlist_update"
  ON "public"."club_shortlist" FOR UPDATE TO authenticated
  USING (auth.uid() = club_user_id)
  WITH CHECK (auth.uid() = club_user_id);

CREATE POLICY "club_shortlist_delete"
  ON "public"."club_shortlist" FOR DELETE TO authenticated
  USING (auth.uid() = club_user_id);

-- RLS: contact_request — clube cria; atleta/responsável aceita/recusa; ambos leem
CREATE POLICY "contact_request_select"
  ON "public"."contact_request" FOR SELECT TO authenticated
  USING (auth.uid() = club_user_id OR auth.uid() = athlete_user_id);

CREATE POLICY "contact_request_insert"
  ON "public"."contact_request" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = club_user_id);

CREATE POLICY "contact_request_update"
  ON "public"."contact_request" FOR UPDATE TO authenticated
  USING (auth.uid() = club_user_id OR auth.uid() = athlete_user_id)
  WITH CHECK (auth.uid() = club_user_id OR auth.uid() = athlete_user_id);
