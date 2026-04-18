import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Insights {
  summary: string;
  strengths: string[];
  suggestions: string[];
  favoriteWorld: string;
}

export const useAIInsights = () => {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);

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
      setInsights(data as Insights);
      return data as Insights;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insights, loading, fetchInsights };
};
