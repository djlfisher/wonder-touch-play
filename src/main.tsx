import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initDeviceId } from "./lib/supabase-headers";

// Initialize device ID header for RLS scoping before any Supabase calls
initDeviceId();

// PWA: prevent service worker registration in iframes / preview hosts
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
