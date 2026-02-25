create type "public"."report_status" as enum ('pendente', 'conteudo_removido', 'usuario_bloqueado', 'rejeitado');

create type "public"."report_target_type" as enum ('video', 'profile', 'validation');


  create table "public"."report" (
    "id" uuid not null default gen_random_uuid(),
    "reporter_user_id" uuid not null,
    "target_type" public.report_target_type not null,
    "target_id" uuid not null,
    "reason" text not null,
    "created_at" timestamp with time zone not null default now(),
    "status" public.report_status not null default 'pendente'::public.report_status
      );


alter table "public"."report" enable row level security;

CREATE INDEX idx_report_created_at ON public.report USING btree (created_at);

CREATE INDEX idx_report_reporter ON public.report USING btree (reporter_user_id);

CREATE INDEX idx_report_status ON public.report USING btree (status);

CREATE INDEX idx_report_target ON public.report USING btree (target_type, target_id);

CREATE UNIQUE INDEX report_pkey ON public.report USING btree (id);

alter table "public"."report" add constraint "report_pkey" PRIMARY KEY using index "report_pkey";

alter table "public"."report" add constraint "report_reporter_user_id_fkey" FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."report" validate constraint "report_reporter_user_id_fkey";

grant delete on table "public"."report" to "anon";

grant insert on table "public"."report" to "anon";

grant references on table "public"."report" to "anon";

grant select on table "public"."report" to "anon";

grant trigger on table "public"."report" to "anon";

grant truncate on table "public"."report" to "anon";

grant update on table "public"."report" to "anon";

grant delete on table "public"."report" to "authenticated";

grant insert on table "public"."report" to "authenticated";

grant references on table "public"."report" to "authenticated";

grant select on table "public"."report" to "authenticated";

grant trigger on table "public"."report" to "authenticated";

grant truncate on table "public"."report" to "authenticated";

grant update on table "public"."report" to "authenticated";

grant delete on table "public"."report" to "service_role";

grant insert on table "public"."report" to "service_role";

grant references on table "public"."report" to "service_role";

grant select on table "public"."report" to "service_role";

grant trigger on table "public"."report" to "service_role";

grant truncate on table "public"."report" to "service_role";

grant update on table "public"."report" to "service_role";


  create policy "report_insert"
  on "public"."report"
  as permissive
  for insert
  to public
with check ((auth.uid() = reporter_user_id));



  create policy "report_select"
  on "public"."report"
  as permissive
  for select
  to public
using (true);



  create policy "report_update"
  on "public"."report"
  as permissive
  for update
  to public
using (true);



