-- Only admins can select (read) reports.

DROP POLICY IF EXISTS "report_select" ON "public"."report";

CREATE POLICY "report_select_admin"
  ON "public"."report"
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
