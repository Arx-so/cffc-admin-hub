-- Returns banned_until for the current user from auth.users (source of truth for ban).
-- Used by the app to block banned users from logging in and to log them out if already in.
CREATE OR REPLACE FUNCTION public.get_my_banned_until()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'auth', 'public'
AS $$
  SELECT banned_until FROM auth.users WHERE id = auth.uid();
$$;
