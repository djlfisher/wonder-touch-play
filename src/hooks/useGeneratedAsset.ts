import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const memCache = new Map<string, string>();

/** Generates (or fetches cached) AI illustration for a (world, prompt) pair. */
export const useGeneratedAsset = (world: string, prompt: string | null, enabled = true) => {
  const [url, setUrl] = useState<string | null>(prompt ? memCache.get(`${world}::${prompt}`) ?? null : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !prompt) return;
    const key = `${world}::${prompt}`;
    if (memCache.has(key)) { setUrl(memCache.get(key)!); return; }

    let cancelled = false;
    setLoading(true);
    supabase.functions.invoke("ai-generate-image", { body: { world, prompt } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.url) { setUrl(null); return; }
        memCache.set(key, data.url);
        setUrl(data.url);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [world, prompt, enabled]);

  return { url, loading };
};
