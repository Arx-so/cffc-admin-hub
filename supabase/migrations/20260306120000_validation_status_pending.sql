-- Add 'pending' to validation_status so validations can start pending before approval/rejection.
-- Default is set in next migration: new enum values cannot be used in same transaction (PostgreSQL).
ALTER TYPE "public"."validation_status" ADD VALUE 'pending' BEFORE 'approved';
