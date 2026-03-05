-- Validation SELECT: involved parties (athlete_user_id or professional_user_id) or admin.

DROP POLICY IF EXISTS "validation_select" ON "public"."validation";

CREATE POLICY "validation_select_involved_or_admin"
  ON "public"."validation"
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = athlete_user_id
    OR auth.uid() = professional_user_id
    OR (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
