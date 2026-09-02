-- Auto-moderation: script-based checks run on new video uploads.
-- auto_status/auto_flags/auto_checked_at record the algorithm's own read on a video,
-- independent of the admin's final decision in "status".

ALTER TABLE "public"."media"
  ADD COLUMN "auto_status" text,
  ADD COLUMN "auto_flags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "auto_checked_at" timestamptz;

ALTER TABLE "public"."media"
  ADD CONSTRAINT "media_auto_status_check"
  CHECK ("auto_status" IS NULL OR "auto_status" IN ('approved', 'flagged'));

COMMENT ON COLUMN "public"."media"."auto_status" IS 'Result of the script-based auto-moderation check: approved (clean, published automatically) or flagged (sent to admin queue). NULL = not yet checked.';
COMMENT ON COLUMN "public"."media"."auto_flags" IS 'Array of {code, message} objects explaining why auto-moderation flagged the video.';
COMMENT ON COLUMN "public"."media"."auto_checked_at" IS 'When the auto-moderation function last evaluated this row.';

CREATE INDEX "idx_media_auto_status" ON "public"."media" USING btree ("auto_status");
