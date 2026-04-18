import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

export const useAINarration = () => {
  const lastCallRef = useRef(0);

  const narrate = useCallback(async (key: string, context: string, speak = true) => {
    // throttle: max 1 call / 1.5s
    const now = Date.now();
    if (now - lastCallRef.current < 1500) return null;
    lastCallRef.current = now;

    let phrase = cache.get(key);
    if (!phrase) {
      try {
        const { data, error } = await supabase.functions.invoke("ai-narrate", { body: { context } });
        if (error || !data?.phrase) return null;
        phrase = data.phrase as string;
        cache.set(key, phrase);
      } catch {
        return null;
      }
    }

    if (speak && typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(phrase);
      u.rate = 0.9; u.pitch = 1.2; u.volume = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
    return phrase;
  }, []);

  return { narrate };
};
