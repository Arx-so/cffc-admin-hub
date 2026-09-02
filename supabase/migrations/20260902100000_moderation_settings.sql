-- Global on/off switch for the script-based video auto-moderation.
-- Singleton row (id always 1). When disabled, media-auto-moderate skips all
-- checks and approves the video directly (auto_status = 'skipped').

CREATE TABLE "public"."moderation_settings" (
  "id" smallint PRIMARY KEY DEFAULT 1,
  "auto_moderation_enabled" boolean NOT NULL DEFAULT true,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "updated_by" uuid REFERENCES "public"."profile"("id") ON DELETE SET NULL,
  CONSTRAINT "moderation_settings_singleton" CHECK ("id" = 1)
);

COMMENT ON TABLE "public"."moderation_settings" IS 'Singleton row holding global moderation toggles.';
COMMENT ON COLUMN "public"."moderation_settings"."auto_moderation_enabled" IS 'When false, media-auto-moderate approves every new video without running any checks.';

INSERT INTO "public"."moderation_settings" ("id", "auto_moderation_enabled") VALUES (1, true);

ALTER TABLE "public"."moderation_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moderation_settings_select_admin"
  ON "public"."moderation_settings"
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'admin'::public.user_role
    AND public.is_current_user_not_banned()
  );

CREATE POLICY "moderation_settings_update_admin"
  ON "public"."moderation_settings"
  FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'admin'::public.user_role
    AND public.is_current_user_not_banned()
  )
  WITH CHECK (
    public.current_user_role() = 'admin'::public.user_role
  );

GRANT SELECT, UPDATE ON "public"."moderation_settings" TO "authenticated";
GRANT ALL ON "public"."moderation_settings" TO "service_role";

-- Allow auto_status = 'skipped' for videos approved while auto-moderation was disabled.
ALTER TABLE "public"."media" DROP CONSTRAINT "media_auto_status_check";
ALTER TABLE "public"."media"
  ADD CONSTRAINT "media_auto_status_check"
  CHECK ("auto_status" IS NULL OR "auto_status" IN ('approved', 'flagged', 'skipped'));

ALTER TYPE public.adm_log_type ADD VALUE IF NOT EXISTS 'moderation_settings_updated';
