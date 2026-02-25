-- Permite que usuários autenticados apaguem denúncias (ex.: botão "Remover denúncia")
CREATE POLICY "report_delete"
ON "public"."report"
FOR DELETE
TO authenticated
USING (true);
