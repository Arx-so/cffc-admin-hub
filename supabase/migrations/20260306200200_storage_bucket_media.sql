-- Define bucket media in migrations (referenced by media_bucket_admin_select).
-- INSERT: authenticated users can upload (object owner = auth.uid()).
-- UPDATE/DELETE: owner or admin (admin for moderation).

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- INSERT: authenticated (owner set by storage on insert)
CREATE POLICY "media_bucket_insert_authenticated"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- SELECT: already have media_bucket_admin_select (admin only). Add owner can read own.
CREATE POLICY "media_bucket_select_owner"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'media'
    AND owner = auth.uid()
  );

-- UPDATE: owner or admin
CREATE POLICY "media_bucket_update_owner_or_admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND (
      owner = auth.uid()
      OR (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
    )
  )
  WITH CHECK (bucket_id = 'media');

-- DELETE: owner or admin
CREATE POLICY "media_bucket_delete_owner_or_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND (
      owner = auth.uid()
      OR (SELECT role FROM public.profile WHERE id = auth.uid()) = 'admin'::public.user_role
    )
  );
