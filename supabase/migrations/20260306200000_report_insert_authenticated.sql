-- Report INSERT: only authenticated users (remove anon access).
-- Keeps same rule: user can only insert as themselves (reporter_user_id = auth.uid()).

DROP POLICY IF EXISTS "report_insert" ON "public"."report";

CREATE POLICY "report_insert_authenticated"
  ON "public"."report"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);
