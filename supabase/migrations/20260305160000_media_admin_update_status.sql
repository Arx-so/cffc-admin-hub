-- Allow admins to update media (e.g. status: pending -> approved/rejected)
CREATE POLICY "media_update_admin"
  ON "public"."media"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."profile" p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."profile" p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
