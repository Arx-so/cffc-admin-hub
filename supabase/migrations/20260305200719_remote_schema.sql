drop policy "professional_document_update_admin" on "public"."professional_document";

alter type "public"."adm_log_type" rename to "adm_log_type__old_version_to_be_dropped";

create type "public"."adm_log_type" as enum ('user_created', 'user_updated', 'user_banned', 'user_validated', 'user_deleted', 'report_handled', 'athlete_profile_updated', 'other', 'user_validation_removed', 'user_unbanned');

alter table "public"."adm_logs" alter column type type "public"."adm_log_type" using type::text::"public"."adm_log_type";

drop type "public"."adm_log_type__old_version_to_be_dropped";

alter table "public"."professional_document" drop column "media_id";

alter table "public"."professional_document" add column "url" text;


  create policy "media_update_admin"
  on "public"."media"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profile p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))))
with check ((EXISTS ( SELECT 1
   FROM public.profile p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role)))));



  create policy "media_bucket_admin_select"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'media'::text) AND (EXISTS ( SELECT 1
   FROM public.profile p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::public.user_role))))));



