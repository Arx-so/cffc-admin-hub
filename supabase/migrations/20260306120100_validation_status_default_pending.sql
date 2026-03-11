-- New validations default to pending (must be in separate migration after ADD VALUE).
ALTER TABLE "public"."validation"
  ALTER COLUMN "status" SET DEFAULT 'pending'::public.validation_status;
