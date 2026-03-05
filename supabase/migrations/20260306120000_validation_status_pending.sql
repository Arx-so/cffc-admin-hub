-- Add 'pending' to validation_status so validations can start pending before approval/rejection
ALTER TYPE "public"."validation_status" ADD VALUE 'pending' BEFORE 'approved';

-- New validations default to pending
ALTER TABLE "public"."validation"
  ALTER COLUMN "status" SET DEFAULT 'pending'::public.validation_status;
