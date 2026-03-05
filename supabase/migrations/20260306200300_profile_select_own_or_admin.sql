-- Profile SELECT: only own row or admin (reduces exposure of all profiles).

DROP POLICY IF EXISTS "profile_select_authenticated" ON "public"."profile";

CREATE POLICY "profile_select_own_or_admin"
  ON "public"."profile"
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
