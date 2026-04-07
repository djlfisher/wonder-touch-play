import { supabase } from "@/integrations/supabase/client";

/**
 * Sets the x-device-id header on the Supabase client so RLS policies
 * can scope data access to the current device.
 */
const setDeviceIdHeader = (deviceId: string) => {
  // Use type assertion to access the internal headers object
  (supabase as any).rest.headers["x-device-id"] = deviceId;
  (supabase as any).realtime.headers["x-device-id"] = deviceId;
};

/**
 * Initializes the device ID and configures the Supabase client header.
 * Call once at app startup.
 */
export const initDeviceId = (): string => {
  let id = localStorage.getItem("le_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("le_device_id", id);
  }
  setDeviceIdHeader(id);
  return id;
};
