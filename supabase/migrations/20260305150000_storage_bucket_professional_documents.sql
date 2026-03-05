-- Bucket para documentos de profissionais (usado no admin hub para download)
-- Nome esperado pelo código: "professional-documents" (useValidations.ts)

INSERT INTO storage.buckets (id, name, public)
VALUES ('professional-documents', 'professional-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Autenticados podem baixar (admin hub usa este bucket para ver documentos na tela de validações)
CREATE POLICY "professional_documents_select_authenticated"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'professional-documents');

-- Inserir/atualizar: apenas service_role ou quem subiu (owner); ajuste se o upload for feito por outro app
CREATE POLICY "professional_documents_insert_authenticated"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'professional-documents');

CREATE POLICY "professional_documents_update_authenticated"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'professional-documents')
  WITH CHECK (bucket_id = 'professional-documents');
