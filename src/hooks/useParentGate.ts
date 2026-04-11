import { useState, useRef, useCallback, useEffect } from "react";

export const useParentGate = () => {
  const [unlocked, setUnlocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchCountRef = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchCountRef.current = e.touches.length;
    if (e.touches.length >= 3) {
      timerRef.current = setTimeout(() => {
        if (touchCountRef.current >= 3) {
          setUnlocked(true);
          // Auto-lock after 30 seconds
          setTimeout(() => setUnlocked(false), 30000);
        }
      }, 2000);
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    touchCountRef.current = e.touches.length;
    if (timerRef.current && e.touches.length < 3) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleTouchStart, handleTouchEnd]);

  // On desktop, always show controls
  const isDesktop = typeof window !== "undefined" && !("ontouchstart" in window);

  return { unlocked: unlocked || isDesktop, lock: () => setUnlocked(false) };
};
