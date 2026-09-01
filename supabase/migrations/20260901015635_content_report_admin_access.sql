CREATE POLICY "content_report_select_admin"
  ON "public"."content_report"
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'admin'::public.user_role
    AND public.is_current_user_not_banned()
  );

CREATE POLICY "content_report_update_admin"
  ON "public"."content_report"
  FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'admin'::public.user_role
    AND public.is_current_user_not_banned()
  )
  WITH CHECK (
    public.current_user_role() = 'admin'::public.user_role
  );

CREATE POLICY "content_report_delete_admin"
  ON "public"."content_report"
  FOR DELETE
  TO authenticated
  USING (
    public.current_user_role() = 'admin'::public.user_role
    AND public.is_current_user_not_banned()
  );
