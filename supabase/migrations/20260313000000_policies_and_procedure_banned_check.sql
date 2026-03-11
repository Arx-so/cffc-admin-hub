-- Add ban check to all RLS policies and list_profiles_for_admin.
-- User must not be banned (banned_until null or in the past) to pass any policy.

CREATE OR REPLACE FUNCTION public.is_current_user_not_banned()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT (public.get_my_banned_until() IS NULL OR public.get_my_banned_until() <= now());
$$;

-- public.adm_logs
DROP POLICY IF EXISTS "adm_logs_insert_admin" ON public.adm_logs;
CREATE POLICY "adm_logs_insert_admin" ON public.adm_logs FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS ( SELECT 1 FROM profile p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role))
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "adm_logs_select_admin" ON public.adm_logs;
CREATE POLICY "adm_logs_select_admin" ON public.adm_logs FOR SELECT TO authenticated
  USING (
    (EXISTS ( SELECT 1 FROM profile p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role))
    AND public.is_current_user_not_banned()
  );

-- public.athlete_profile
DROP POLICY IF EXISTS "athlete_profile_insert_own" ON public.athlete_profile;
CREATE POLICY "athlete_profile_insert_own" ON public.athlete_profile FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "athlete_profile_select_own_or_admin" ON public.athlete_profile;
CREATE POLICY "athlete_profile_select_own_or_admin" ON public.athlete_profile FOR SELECT TO authenticated
  USING (
    (user_id = auth.uid() OR current_user_role() = 'admin'::user_role)
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "athlete_profile_update_own" ON public.athlete_profile;
CREATE POLICY "athlete_profile_update_own" ON public.athlete_profile FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.is_current_user_not_banned())
  WITH CHECK (auth.uid() = user_id);

-- public.club_shortlist
DROP POLICY IF EXISTS "club_shortlist_delete" ON public.club_shortlist;
CREATE POLICY "club_shortlist_delete" ON public.club_shortlist FOR DELETE TO authenticated
  USING (auth.uid() = club_user_id AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "club_shortlist_insert" ON public.club_shortlist;
CREATE POLICY "club_shortlist_insert" ON public.club_shortlist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = club_user_id AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "club_shortlist_select" ON public.club_shortlist;
CREATE POLICY "club_shortlist_select" ON public.club_shortlist FOR SELECT TO authenticated
  USING ((auth.uid() = club_user_id OR auth.uid() = athlete_user_id) AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "club_shortlist_update" ON public.club_shortlist;
CREATE POLICY "club_shortlist_update" ON public.club_shortlist FOR UPDATE TO authenticated
  USING (auth.uid() = club_user_id AND public.is_current_user_not_banned())
  WITH CHECK (auth.uid() = club_user_id);

-- public.contact_request
DROP POLICY IF EXISTS "contact_request_insert" ON public.contact_request;
CREATE POLICY "contact_request_insert" ON public.contact_request FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = club_user_id AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "contact_request_select" ON public.contact_request;
CREATE POLICY "contact_request_select" ON public.contact_request FOR SELECT TO authenticated
  USING ((auth.uid() = club_user_id OR auth.uid() = athlete_user_id) AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "contact_request_update" ON public.contact_request;
CREATE POLICY "contact_request_update" ON public.contact_request FOR UPDATE TO authenticated
  USING ((auth.uid() = club_user_id OR auth.uid() = athlete_user_id) AND public.is_current_user_not_banned())
  WITH CHECK ((auth.uid() = club_user_id OR auth.uid() = athlete_user_id));

-- public.media
DROP POLICY IF EXISTS "media_delete_own" ON public.media;
CREATE POLICY "media_delete_own" ON public.media FOR DELETE TO authenticated
  USING (auth.uid() = athlete_user_id AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "media_insert_own" ON public.media;
CREATE POLICY "media_insert_own" ON public.media FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = athlete_user_id AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "media_select_own_or_admin" ON public.media;
CREATE POLICY "media_select_own_or_admin" ON public.media FOR SELECT TO authenticated
  USING (
    (athlete_user_id = auth.uid() OR current_user_role() = 'admin'::user_role)
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "media_update_admin" ON public.media;
CREATE POLICY "media_update_admin" ON public.media FOR UPDATE TO authenticated
  USING (
    (EXISTS ( SELECT 1 FROM profile p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role))
    AND public.is_current_user_not_banned()
  )
  WITH CHECK (
    (EXISTS ( SELECT 1 FROM profile p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role))
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "media_update_own" ON public.media;
CREATE POLICY "media_update_own" ON public.media FOR UPDATE TO authenticated
  USING (auth.uid() = athlete_user_id AND public.is_current_user_not_banned())
  WITH CHECK (auth.uid() = athlete_user_id);

-- public.professional_document
DROP POLICY IF EXISTS "professional_document_delete_admin" ON public.professional_document;
CREATE POLICY "professional_document_delete_admin" ON public.professional_document FOR DELETE TO authenticated
  USING (current_user_role() = 'admin'::user_role AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "professional_document_insert_own" ON public.professional_document;
CREATE POLICY "professional_document_insert_own" ON public.professional_document FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "professional_document_select_own_or_admin" ON public.professional_document;
CREATE POLICY "professional_document_select_own_or_admin" ON public.professional_document FOR SELECT TO authenticated
  USING (
    (profile_id = auth.uid() OR current_user_role() = 'admin'::user_role)
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "professional_document_update_admin" ON public.professional_document;
CREATE POLICY "professional_document_update_admin" ON public.professional_document FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin'::user_role AND public.is_current_user_not_banned())
  WITH CHECK (current_user_role() = 'admin'::user_role);

-- public.profile
DROP POLICY IF EXISTS "profile_insert_own" ON public.profile;
CREATE POLICY "profile_insert_own" ON public.profile FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "profile_select_own_or_admin" ON public.profile;
CREATE POLICY "profile_select_own_or_admin" ON public.profile FOR SELECT TO authenticated
  USING (
    (auth.uid() = id OR current_user_role() = 'admin'::user_role)
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "profile_update_admin" ON public.profile;
CREATE POLICY "profile_update_admin" ON public.profile FOR UPDATE TO authenticated
  USING (
    (EXISTS ( SELECT 1 FROM profile pr WHERE pr.id = auth.uid() AND pr.role = 'admin'::user_role))
    AND public.is_current_user_not_banned()
  )
  WITH CHECK (
    (EXISTS ( SELECT 1 FROM profile pr WHERE pr.id = auth.uid() AND pr.role = 'admin'::user_role))
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "profile_update_own" ON public.profile;
CREATE POLICY "profile_update_own" ON public.profile FOR UPDATE TO authenticated
  USING (auth.uid() = id AND public.is_current_user_not_banned())
  WITH CHECK (auth.uid() = id);

-- public.report
DROP POLICY IF EXISTS "report_delete_admin" ON public.report;
CREATE POLICY "report_delete_admin" ON public.report FOR DELETE TO authenticated
  USING (current_user_role() = 'admin'::user_role AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "report_insert_authenticated" ON public.report;
CREATE POLICY "report_insert_authenticated" ON public.report FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "report_select_admin" ON public.report;
CREATE POLICY "report_select_admin" ON public.report FOR SELECT TO authenticated
  USING (current_user_role() = 'admin'::user_role AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "report_update_admin" ON public.report;
CREATE POLICY "report_update_admin" ON public.report FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin'::user_role AND public.is_current_user_not_banned())
  WITH CHECK (current_user_role() = 'admin'::user_role);

-- public.validation
DROP POLICY IF EXISTS "validation_delete_admin" ON public.validation;
CREATE POLICY "validation_delete_admin" ON public.validation FOR DELETE TO authenticated
  USING (current_user_role() = 'admin'::user_role AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "validation_insert" ON public.validation;
CREATE POLICY "validation_insert" ON public.validation FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = professional_user_id AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "validation_select_involved_or_admin" ON public.validation;
CREATE POLICY "validation_select_involved_or_admin" ON public.validation FOR SELECT TO authenticated
  USING (
    (auth.uid() = athlete_user_id OR auth.uid() = professional_user_id OR current_user_role() = 'admin'::user_role)
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "validation_update" ON public.validation;
CREATE POLICY "validation_update" ON public.validation FOR UPDATE TO authenticated
  USING (auth.uid() = professional_user_id AND public.is_current_user_not_banned())
  WITH CHECK (auth.uid() = professional_user_id);

DROP POLICY IF EXISTS "validation_update_admin" ON public.validation;
CREATE POLICY "validation_update_admin" ON public.validation FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin'::user_role AND public.is_current_user_not_banned())
  WITH CHECK (current_user_role() = 'admin'::user_role);

-- storage.objects
DROP POLICY IF EXISTS "media_bucket_admin_select" ON storage.objects;
CREATE POLICY "media_bucket_admin_select" ON storage.objects FOR SELECT TO authenticated
  USING (
    (bucket_id = 'media' AND (EXISTS ( SELECT 1 FROM profile p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role)))
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "media_bucket_delete_owner_or_admin" ON storage.objects;
CREATE POLICY "media_bucket_delete_owner_or_admin" ON storage.objects FOR DELETE TO authenticated
  USING (
    (bucket_id = 'media' AND (owner = auth.uid() OR current_user_role() = 'admin'::user_role))
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "media_bucket_insert_athlete" ON storage.objects;
CREATE POLICY "media_bucket_insert_athlete" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    (bucket_id = 'media' AND current_user_role() = 'athlete'::user_role)
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "media_bucket_select_owner" ON storage.objects;
CREATE POLICY "media_bucket_select_owner" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND owner = auth.uid() AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "media_bucket_update_owner_or_admin" ON storage.objects;
CREATE POLICY "media_bucket_update_owner_or_admin" ON storage.objects FOR UPDATE TO authenticated
  USING (
    (bucket_id = 'media' AND (owner = auth.uid() OR current_user_role() = 'admin'::user_role))
    AND public.is_current_user_not_banned()
  )
  WITH CHECK (bucket_id = 'media' AND public.is_current_user_not_banned());

DROP POLICY IF EXISTS "professional_documents_insert_pro" ON storage.objects;
CREATE POLICY "professional_documents_insert_pro" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    (bucket_id = 'professional-documents' AND current_user_role() = 'pro'::user_role)
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "professional_documents_select_admin_or_own" ON storage.objects;
CREATE POLICY "professional_documents_select_admin_or_own" ON storage.objects FOR SELECT TO authenticated
  USING (
    (bucket_id = 'professional-documents' AND (current_user_role() = 'admin'::user_role OR owner = auth.uid()))
    AND public.is_current_user_not_banned()
  );

DROP POLICY IF EXISTS "professional_documents_update_admin" ON storage.objects;
CREATE POLICY "professional_documents_update_admin" ON storage.objects FOR UPDATE TO authenticated
  USING (
    (bucket_id = 'professional-documents' AND current_user_role() = 'admin'::user_role)
    AND public.is_current_user_not_banned()
  )
  WITH CHECK (
    (bucket_id = 'professional-documents' AND current_user_role() = 'admin'::user_role)
    AND public.is_current_user_not_banned()
  );

-- list_profiles_for_admin: caller must not be banned
CREATE OR REPLACE FUNCTION public.list_profiles_for_admin(p_offset bigint DEFAULT 0, p_limit bigint DEFAULT 10, p_search text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, name text, email text, role public.user_role, created_at timestamp with time zone, phone text, city text, state text, birth_date date, banned_until timestamp with time zone, validated boolean, total_count bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
WITH filtered AS (
  SELECT
    p.id,
    p.name,
    p.email,
    p.role,
    p.created_at,
    p.phone,
    p.city,
    p.state,
    p.birth_date,
    u.banned_until,
    COALESCE(p.verified, false) AS validated
  FROM public.profile p
  JOIN auth.users u ON u.id = p.id
  WHERE (SELECT pr.role FROM public.profile pr WHERE pr.id = auth.uid()) = 'admin'
    AND (public.get_my_banned_until() IS NULL OR public.get_my_banned_until() <= now())
    AND p.id IS DISTINCT FROM auth.uid()
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.name ILIKE '%' || p_search || '%'
      OR p.email ILIKE '%' || p_search || '%'
    )
),
counted AS (
  SELECT count(*) AS total FROM filtered
)
SELECT
  f.id,
  f.name,
  f.email,
  f.role,
  f.created_at,
  f.phone,
  f.city,
  f.state,
  f.birth_date,
  f.banned_until,
  f.validated,
  c.total AS total_count
FROM filtered f
CROSS JOIN counted c
ORDER BY f.name, f.created_at DESC
LIMIT greatest(0, p_limit)
OFFSET greatest(0, p_offset);
$function$;
