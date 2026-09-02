-- Allow admins to delete any media row (previously only the owning athlete could).
-- Storage object deletion is already covered by media_bucket_delete_owner_or_admin.

CREATE POLICY "media_delete_admin"
  ON "public"."media"
  FOR DELETE
  TO authenticated
  USING (
    public.current_user_role() = 'admin'::public.user_role
    AND public.is_current_user_not_banned()
  );

ALTER TYPE public.adm_log_type ADD VALUE IF NOT EXISTS 'media_deleted';
