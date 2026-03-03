set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.list_profiles_for_admin(p_offset bigint DEFAULT 0, p_limit bigint DEFAULT 10, p_search text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, name text, email text, role public.user_role, created_at timestamp with time zone, phone text, city text, state text, birth_date date, banned_until timestamp with time zone, validated boolean, total_count bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$WITH filtered AS (
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
      EXISTS (
        SELECT 1
        FROM public.validation v
        WHERE v.athlete_user_id = p.id
          AND v.status = 'approved'
      ) AS validated
    FROM public.profile p
    JOIN auth.users u ON u.id = p.id
    WHERE (SELECT pr.role FROM public.profile pr WHERE pr.id = auth.uid()) = 'admin'
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
  OFFSET greatest(0, p_offset);$function$
;


  create policy "validation_delete_admin"
  on "public"."validation"
  as permissive
  for delete
  to authenticated
using ((( SELECT profile.role
   FROM public.profile
  WHERE (profile.id = auth.uid())) = 'admin'::public.user_role));



