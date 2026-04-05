
-- Create app_sessions table for anonymous device sessions
CREATE TABLE public.app_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_app_sessions_device_id ON public.app_sessions (device_id);

ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create sessions"
ON public.app_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read their own session by device_id"
ON public.app_sessions FOR SELECT
USING (true);

CREATE POLICY "Anyone can update their own session"
ON public.app_sessions FOR UPDATE
USING (true);

-- Create child_settings table
CREATE TABLE public.child_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.app_sessions(id) ON DELETE CASCADE,
  world_color BOOLEAN NOT NULL DEFAULT true,
  world_shape BOOLEAN NOT NULL DEFAULT true,
  world_pattern BOOLEAN NOT NULL DEFAULT true,
  world_motion BOOLEAN NOT NULL DEFAULT true,
  session_minutes INTEGER NOT NULL DEFAULT 15,
  calm_mode BOOLEAN NOT NULL DEFAULT false,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_child_settings_session ON public.child_settings (session_id);

ALTER TABLE public.child_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage child settings"
ON public.child_settings FOR ALL
USING (true)
WITH CHECK (true);

-- Create interaction_events table for analytics
CREATE TABLE public.interaction_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.app_sessions(id) ON DELETE CASCADE,
  world TEXT NOT NULL,
  event_type TEXT NOT NULL,
  x_pos REAL,
  y_pos REAL,
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_interaction_events_session ON public.interaction_events (session_id);
CREATE INDEX idx_interaction_events_world ON public.interaction_events (world);

ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert interaction events"
ON public.interaction_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read interaction events"
ON public.interaction_events FOR SELECT
USING (true);

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_app_sessions_updated_at
BEFORE UPDATE ON public.app_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_child_settings_updated_at
BEFORE UPDATE ON public.child_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
