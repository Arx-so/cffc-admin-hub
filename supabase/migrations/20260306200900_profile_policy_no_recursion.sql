-- Avoid infinite recursion: profile policy must not read from profile.
-- Helper runs as definer and bypasses RLS when reading own role.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profile WHERE id = auth.uid();
$$;

-- Recreate profile SELECT policy using the function instead of inline subquery
DROP POLICY IF EXISTS "profile_select_own_or_admin" ON "public"."profile";

CREATE POLICY "profile_select_own_or_admin"
  ON "public"."profile"
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.current_user_role() = 'admin'::public.user_role
  );
