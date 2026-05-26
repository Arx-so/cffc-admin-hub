-- Athlete_profile SELECT: own profile or admin (can relax later with is_searchable if needed).

DROP POLICY IF EXISTS "athlete_profile_select" ON "public"."athlete_profile";

CREATE POLICY "athlete_profile_select_own_or_admin"
  ON "public"."athlete_profile"
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
