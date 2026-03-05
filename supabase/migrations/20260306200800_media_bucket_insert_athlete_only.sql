-- Media bucket INSERT: only profiles with role "athlete".

DROP POLICY IF EXISTS "media_bucket_insert_authenticated" ON storage.objects;

CREATE POLICY "media_bucket_insert_athlete"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (SELECT role FROM public.profile WHERE id = auth.uid()) = 'athlete'::public.user_role
  );
