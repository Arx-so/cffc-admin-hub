-- Admin can update validation (e.g. when approving/rejecting professional document)
CREATE POLICY "validation_update_admin"
  ON "public"."validation"
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  )
  WITH CHECK (
    (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
