import { supabase } from "@/integrations/supabase/client";
import { ensureAnonSession } from "@/lib/supabase-headers";

let cached: Promise<string | null> | null = null;

/** Returns the app_sessions.id for the current anon user, creating one if needed. */
export const getAppSessionId = (): Promise<string | null> => {
  if (cached) return cached;
  cached = (async () => {
    const userId = await ensureAnonSession();
    if (!userId) return null;
    const { data } = await supabase
      .from("app_sessions")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (data?.id) return data.id;
    const { data: created } = await supabase
      .from("app_sessions")
      .insert({ device_id: userId, user_id: userId })
      .select("id")
      .single();
    return created?.id ?? null;
  })();
  return cached;
};
