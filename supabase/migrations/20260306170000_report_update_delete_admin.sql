-- Only admins can update or delete reports (same pattern as validation).
-- Drop existing permissive policies and create admin-only ones.

DROP POLICY IF EXISTS "report_update" ON "public"."report";
DROP POLICY IF EXISTS "report_delete" ON "public"."report";

CREATE POLICY "report_update_admin"
  ON "public"."report"
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  )
  WITH CHECK (
    (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );

CREATE POLICY "report_delete_admin"
  ON "public"."report"
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
