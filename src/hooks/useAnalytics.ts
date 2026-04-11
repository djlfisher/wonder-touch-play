import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const getSessionId = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      // Check if we have an app_session for this user
      const { data } = await supabase
        .from("app_sessions")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (data?.id) return data.id;

      // Create one
      const { data: newSession } = await supabase
        .from("app_sessions")
        .insert({ device_id: session.user.id, user_id: session.user.id })
        .select("id")
        .single();
      return newSession?.id ?? null;
    }
  } catch {}
  return null;
};

// Cache the session id promise so we only resolve once
let cachedSessionId: Promise<string | null> | null = null;
const getCachedSessionId = () => {
  if (!cachedSessionId) cachedSessionId = getSessionId();
  return cachedSessionId;
};

export const useAnalytics = (world: string) => {
  const batchRef = useRef<Array<{
    session_id: string | null;
    world: string;
    event_type: string;
    x_pos: number | null;
    y_pos: number | null;
    metadata: Json | null;
  }>>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (batchRef.current.length === 0) return;
    const events = [...batchRef.current];
    batchRef.current = [];

    // Resolve session id for all events
    const sessionId = await getCachedSessionId();
    const withSession = events.map((e) => ({ ...e, session_id: sessionId }));

    try {
      await supabase.from("interaction_events").insert(withSession);
    } catch {
      // silently fail — analytics should never break the app
    }
  }, []);

  const trackEvent = useCallback(
    (eventType: string, x?: number, y?: number, metadata?: Record<string, Json | undefined>) => {
      batchRef.current.push({
        session_id: null, // will be resolved at flush time
        world,
        event_type: eventType,
        x_pos: x ?? null,
        y_pos: y ?? null,
        metadata: metadata ?? null,
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 2000);

      if (batchRef.current.length >= 10) {
        if (timerRef.current) clearTimeout(timerRef.current);
        flush();
      }
    },
    [world, flush]
  );

  return { trackEvent, flush };
};
