alter type "public"."adm_log_type" rename to "adm_log_type__old_version_to_be_dropped";

create type "public"."adm_log_type" as enum ('user_created', 'user_updated', 'user_banned', 'user_validated', 'user_deleted', 'report_handled', 'athlete_profile_updated', 'other', 'user_validation_removed', 'user_unbanned', 'media_approved', 'media_rejected', 'professional_document_approved', 'professional_document_rejected');

alter table "public"."adm_logs" alter column type type "public"."adm_log_type" using type::text::"public"."adm_log_type";

drop type "public"."adm_log_type__old_version_to_be_dropped";


