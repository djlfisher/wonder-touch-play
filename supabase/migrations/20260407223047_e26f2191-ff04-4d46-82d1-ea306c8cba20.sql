
-- Helper function to extract device_id from request headers
CREATE OR REPLACE FUNCTION public.requesting_device_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    current_setting('request.headers', true)::json->>'x-device-id',
    ''
  );
$$;

-- ========== app_sessions ==========

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.app_sessions;
DROP POLICY IF EXISTS "Anyone can read their own session by device_id" ON public.app_sessions;
DROP POLICY IF EXISTS "Anyone can update their own session" ON public.app_sessions;

-- Recreate scoped policies
CREATE POLICY "Devices can create sessions"
  ON public.app_sessions FOR INSERT
  WITH CHECK (device_id = public.requesting_device_id());

CREATE POLICY "Devices can read own sessions"
  ON public.app_sessions FOR SELECT
  USING (device_id = public.requesting_device_id());

CREATE POLICY "Devices can update own sessions"
  ON public.app_sessions FOR UPDATE
  USING (device_id = public.requesting_device_id())
  WITH CHECK (device_id = public.requesting_device_id());

-- ========== child_settings ==========

DROP POLICY IF EXISTS "Anyone can manage child settings" ON public.child_settings;

CREATE POLICY "Devices can read own child settings"
  ON public.child_settings FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.app_sessions WHERE device_id = public.requesting_device_id()
    )
  );

CREATE POLICY "Devices can insert own child settings"
  ON public.child_settings FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.app_sessions WHERE device_id = public.requesting_device_id()
    )
  );

CREATE POLICY "Devices can update own child settings"
  ON public.child_settings FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.app_sessions WHERE device_id = public.requesting_device_id()
    )
  );

-- ========== interaction_events ==========

DROP POLICY IF EXISTS "Anyone can insert interaction events" ON public.interaction_events;
DROP POLICY IF EXISTS "Anyone can read interaction events" ON public.interaction_events;

-- INSERT: allow inserting only if session belongs to this device (or null session)
CREATE POLICY "Devices can insert interaction events"
  ON public.interaction_events FOR INSERT
  WITH CHECK (
    session_id IS NULL
    OR session_id IN (
      SELECT id FROM public.app_sessions WHERE device_id = public.requesting_device_id()
    )
  );

-- SELECT: only read events from own sessions
CREATE POLICY "Devices can read own interaction events"
  ON public.interaction_events FOR SELECT
  USING (
    session_id IS NULL
    OR session_id IN (
      SELECT id FROM public.app_sessions WHERE device_id = public.requesting_device_id()
    )
  );
