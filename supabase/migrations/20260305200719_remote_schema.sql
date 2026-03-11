drop policy "professional_document_update_admin" on "public"."professional_document";

alter type "public"."adm_log_type" rename to "adm_log_type__old_version_to_be_dropped";

create type "public"."adm_log_type" as enum ('user_created', 'user_updated', 'user_banned', 'user_validated', 'user_deleted', 'report_handled', 'athlete_profile_updated', 'other', 'user_validation_removed', 'user_unbanned');

alter table "public"."adm_logs" alter column type type "public"."adm_log_type" using type::text::"public"."adm_log_type";

drop type "public"."adm_log_type__old_version_to_be_dropped";

alter table "public"."professional_document" drop column "media_id";

alter table "public"."professional_document" add column "url" text;

-- Policies "media_update_admin" and "media_bucket_admin_select" already created
-- in 20260305160000_media_admin_update_status.sql and 20260305170000_storage_media_admin_select.sql

