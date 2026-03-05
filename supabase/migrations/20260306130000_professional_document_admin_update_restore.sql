-- Restore: admin can update professional_document (approve/reject) after remote_schema dropped this policy
CREATE POLICY "professional_document_update_admin"
  ON "public"."professional_document"
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  )
  WITH CHECK (
    (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
