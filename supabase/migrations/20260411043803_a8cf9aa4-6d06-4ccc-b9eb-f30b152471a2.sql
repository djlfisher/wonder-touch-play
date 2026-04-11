
-- 1. Add user_id column to app_sessions
ALTER TABLE public.app_sessions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill: we can't recover user_ids for old rows, but new ones will have it
-- Make it required for new rows after backfill window
-- For now allow null so existing rows don't break

-- 2. Drop all old RLS policies on app_sessions
DROP POLICY IF EXISTS "Devices can create sessions" ON public.app_sessions;
DROP POLICY IF EXISTS "Devices can read own sessions" ON public.app_sessions;
DROP POLICY IF EXISTS "Devices can update own sessions" ON public.app_sessions;

-- 3. Create new auth.uid()-based policies on app_sessions
CREATE POLICY "Users can create own sessions"
ON public.app_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own sessions"
ON public.app_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON public.app_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Drop all old RLS policies on child_settings
DROP POLICY IF EXISTS "Devices can insert own child settings" ON public.child_settings;
DROP POLICY IF EXISTS "Devices can read own child settings" ON public.child_settings;
DROP POLICY IF EXISTS "Devices can update own child settings" ON public.child_settings;

-- 5. Create new policies on child_settings scoped to auth.uid()
CREATE POLICY "Users can insert own child settings"
ON public.child_settings FOR INSERT
TO authenticated
WITH CHECK (session_id IN (
  SELECT id FROM public.app_sessions WHERE user_id = auth.uid()
));

CREATE POLICY "Users can read own child settings"
ON public.child_settings FOR SELECT
TO authenticated
USING (session_id IN (
  SELECT id FROM public.app_sessions WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update own child settings"
ON public.child_settings FOR UPDATE
TO authenticated
USING (session_id IN (
  SELECT id FROM public.app_sessions WHERE user_id = auth.uid()
));

-- 6. Drop all old RLS policies on interaction_events
DROP POLICY IF EXISTS "Devices can insert interaction events" ON public.interaction_events;
DROP POLICY IF EXISTS "Devices can read own interaction events" ON public.interaction_events;

-- 7. Create new policies on interaction_events — NO null session branch
CREATE POLICY "Users can insert own interaction events"
ON public.interaction_events FOR INSERT
TO authenticated
WITH CHECK (session_id IN (
  SELECT id FROM public.app_sessions WHERE user_id = auth.uid()
));

CREATE POLICY "Users can read own interaction events"
ON public.interaction_events FOR SELECT
TO authenticated
USING (session_id IN (
  SELECT id FROM public.app_sessions WHERE user_id = auth.uid()
));

-- 8. Drop the old spoofable function
DROP FUNCTION IF EXISTS public.requesting_device_id();
