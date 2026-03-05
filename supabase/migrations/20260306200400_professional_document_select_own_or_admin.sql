-- Professional_document SELECT: own documents (profile_id = auth.uid()) or admin.

DROP POLICY IF EXISTS "professional_document_select" ON "public"."professional_document";

CREATE POLICY "professional_document_select_own_or_admin"
  ON "public"."professional_document"
  FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
