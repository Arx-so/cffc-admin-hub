-- Allow admins to read objects in the media bucket (for createSignedUrl in Videos in Analysis)
CREATE POLICY "media_bucket_admin_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profile p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
