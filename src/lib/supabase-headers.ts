import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures the user has an anonymous Supabase auth session.
 * This replaces the old x-device-id header approach with
 * cryptographically signed JWTs via Supabase anonymous auth.
 */
export const ensureAnonSession = async (): Promise<string | null> => {
  // Check for existing session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;

  // Sign in anonymously — creates a real auth.users row with a JWT
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("Anonymous auth failed:", error.message);
    return null;
  }
  return data.user?.id ?? null;
};
