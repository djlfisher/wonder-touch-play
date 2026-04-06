import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const getDeviceId = (): string => {
  let id = localStorage.getItem("le_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("le_device_id", id);
  }
  return id;
};

const getSessionId = (): string | null => {
  return localStorage.getItem("le_session_id");
};

export const useAnalytics = (world: string) => {
  const batchRef = useRef<Array<{
    session_id: string | null;
    world: string;
    event_type: string;
    x_pos: number | null;
    y_pos: number | null;
    metadata: Record<string, unknown> | null;
  }>>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (batchRef.current.length === 0) return;
    const events = [...batchRef.current];
    batchRef.current = [];
    try {
      await supabase.from("interaction_events").insert(events);
    } catch {
      // silently fail — analytics should never break the app
    }
  }, []);

  const trackEvent = useCallback(
    (eventType: string, x?: number, y?: number, metadata?: Record<string, unknown>) => {
      batchRef.current.push({
        session_id: getSessionId(),
        world,
        event_type: eventType,
        x_pos: x ?? null,
        y_pos: y ?? null,
        metadata: metadata ?? null,
      });

      // Debounce flush to batch rapid interactions
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 2000);

      // Also flush if batch gets large
      if (batchRef.current.length >= 10) {
        if (timerRef.current) clearTimeout(timerRef.current);
        flush();
      }
    },
    [world, flush]
  );

  return { trackEvent, flush };
};
