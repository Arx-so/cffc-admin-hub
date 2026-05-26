-- Media SELECT: own rows (athlete_user_id = auth.uid()) or admin.

DROP POLICY IF EXISTS "media_select" ON "public"."media";

CREATE POLICY "media_select_own_or_admin"
  ON "public"."media"
  FOR SELECT
  TO authenticated
  USING (
    athlete_user_id = auth.uid()
    OR (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
