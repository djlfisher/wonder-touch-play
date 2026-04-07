import { supabase } from "@/integrations/supabase/client";

/**
 * Sets the x-device-id header on the Supabase client so RLS policies
 * can scope data access to the current device.
 */
export const setDeviceIdHeader = (deviceId: string) => {
  supabase.rest.headers["x-device-id"] = deviceId;
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
