-- parent_conversations
CREATE TABLE public.parent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.app_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversations" ON public.parent_conversations
FOR SELECT TO authenticated
USING (session_id IN (SELECT id FROM public.app_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users insert own conversations" ON public.parent_conversations
FOR INSERT TO authenticated
WITH CHECK (session_id IN (SELECT id FROM public.app_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users update own conversations" ON public.parent_conversations
FOR UPDATE TO authenticated
USING (session_id IN (SELECT id FROM public.app_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users delete own conversations" ON public.parent_conversations
FOR DELETE TO authenticated
USING (session_id IN (SELECT id FROM public.app_sessions WHERE user_id = auth.uid()));

CREATE TRIGGER trg_parent_conversations_updated
BEFORE UPDATE ON public.parent_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- parent_messages
CREATE TABLE public.parent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.parent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parent_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_parent_messages_conv ON public.parent_messages(conversation_id, created_at);

CREATE POLICY "Users read own messages" ON public.parent_messages
FOR SELECT TO authenticated
USING (conversation_id IN (
  SELECT c.id FROM public.parent_conversations c
  JOIN public.app_sessions s ON s.id = c.session_id
  WHERE s.user_id = auth.uid()
));

CREATE POLICY "Users insert own messages" ON public.parent_messages
FOR INSERT TO authenticated
WITH CHECK (conversation_id IN (
  SELECT c.id FROM public.parent_conversations c
  JOIN public.app_sessions s ON s.id = c.session_id
  WHERE s.user_id = auth.uid()
));

CREATE POLICY "Users delete own messages" ON public.parent_messages
FOR DELETE TO authenticated
USING (conversation_id IN (
  SELECT c.id FROM public.parent_conversations c
  JOIN public.app_sessions s ON s.id = c.session_id
  WHERE s.user_id = auth.uid()
));

-- ai_asset_cache
CREATE TABLE public.ai_asset_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (world, prompt_hash)
);
ALTER TABLE public.ai_asset_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read ai cache" ON public.ai_asset_cache
FOR SELECT TO authenticated USING (true);
-- writes restricted to service role (no policy needed; service role bypasses RLS)

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-assets', 'ai-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read ai-assets" ON storage.objects
FOR SELECT USING (bucket_id = 'ai-assets');
