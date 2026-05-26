-- Apenas admins podem atualizar ou deletar documentos (aprovar/rejeitar ou remover).
-- O dono continua podendo inserir (upload); alteração e exclusão ficam restritas ao admin.

DROP POLICY IF EXISTS "professional_document_update_own" ON "public"."professional_document";
DROP POLICY IF EXISTS "professional_document_delete_own" ON "public"."professional_document";

CREATE POLICY "professional_document_delete_admin"
  ON "public"."professional_document"
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
  );
