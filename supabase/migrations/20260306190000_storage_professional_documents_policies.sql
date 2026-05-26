-- professional-documents bucket: insert only "pro", select admin or own, update only admin.

DROP POLICY IF EXISTS "professional_documents_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "professional_documents_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "professional_documents_update_authenticated" ON storage.objects;

-- INSERT: only profiles with role "pro"
CREATE POLICY "professional_documents_insert_pro"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'professional-documents'
    AND (SELECT role FROM public.profile WHERE id = auth.uid()) = 'pro'::public.user_role
  );

-- SELECT: admin or owner of the document (document that is their own)
CREATE POLICY "professional_documents_select_admin_or_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'professional-documents'
    AND (
      (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
      OR owner = auth.uid()
    )
  );

-- UPDATE: only admin
CREATE POLICY "professional_documents_update_admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'professional-documents'
    AND (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  )
  WITH CHECK (
    bucket_id = 'professional-documents'
    AND (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
