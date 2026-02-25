-- Profile: RLS policies (SELECT, INSERT, UPDATE)

CREATE POLICY "profile_select_authenticated"
ON "public"."profile"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profile_insert_own"
ON "public"."profile"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profile_update_own"
ON "public"."profile"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
