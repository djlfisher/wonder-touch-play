import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Insights {
  summary: string;
  strengths: string[];
  suggestions: string[];
  favoriteWorld: string;
  recommendedWorld: string;
}

const STORAGE_KEY = "le_insights_cache";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

type Cache = { ts: number; insights: Insights };

const loadCache = (): Cache | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cache;
    if (Date.now() - c.ts > CACHE_TTL_MS) return null;
    return c;
  } catch { return null; }
};

export const useAIInsights = (onInsights?: (i: Insights) => void) => {
  const [insights, setInsights] = useState<Insights | null>(() => loadCache()?.insights ?? null);
  const [loading, setLoading] = useState(false);

  // Fire onInsights for cached value on mount
  useEffect(() => {
    if (insights && onInsights) onInsights(insights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInsights = useCallback(async (stats: unknown) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", { body: { stats } });
      if (error) {
        const msg = error.message || "Could not generate insights";
        if (msg.includes("429")) toast({ title: "Slow down", description: "Too many requests — please wait a moment." });
        else if (msg.includes("402")) toast({ title: "AI credits needed", description: "Add credits in Settings → Workspace → Usage." });
        else toast({ title: "Insights unavailable", description: msg });
        return null;
      }
      const result = data as Insights;
      setInsights(result);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), insights: result })); } catch {}
      onInsights?.(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [onInsights]);

  return { insights, loading, fetchInsights };
};
