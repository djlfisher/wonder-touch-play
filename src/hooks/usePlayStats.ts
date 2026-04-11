import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WorldStat {
  world: string;
  count: number;
}

interface PlayStats {
  todayTaps: number;
  favoriteWorld: string | null;
  worldStats: WorldStat[];
  weekActivity: boolean[]; // last 7 days, true = played
  loading: boolean;
}

export const usePlayStats = (): PlayStats => {
  const [stats, setStats] = useState<PlayStats>({
    todayTaps: 0,
    favoriteWorld: null,
    worldStats: [],
    weekActivity: Array(7).fill(false),
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        // Today's taps
        const { count: todayTaps } = await supabase
          .from("interaction_events")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayStart);

        // All-time world distribution
        const { data: allEvents } = await supabase
          .from("interaction_events")
          .select("world, created_at");

        const worldCounts: Record<string, number> = {};
        const daySet = new Set<string>();
        const last7 = Array(7).fill(false);

        (allEvents || []).forEach((e) => {
          worldCounts[e.world] = (worldCounts[e.world] || 0) + 1;
          const d = new Date(e.created_at);
          const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
          if (diffDays >= 0 && diffDays < 7) {
            last7[6 - diffDays] = true;
          }
        });

        const worldStats = Object.entries(worldCounts)
          .map(([world, count]) => ({ world, count }))
          .sort((a, b) => b.count - a.count);

        setStats({
          todayTaps: todayTaps || 0,
          favoriteWorld: worldStats[0]?.world || null,
          worldStats,
          weekActivity: last7,
          loading: false,
        });
      } catch {
        setStats((s) => ({ ...s, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
