import { useState, useCallback, useRef, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { useAnalytics } from "@/hooks/useAnalytics";

const COLORS = [
  "hsl(350, 70%, 65%)",
  "hsl(200, 70%, 72%)",
  "hsl(160, 50%, 65%)",
  "hsl(270, 60%, 75%)",
  "hsl(45, 90%, 65%)",
  "hsl(20, 80%, 75%)",
  "hsl(180, 60%, 60%)",
  "hsl(320, 60%, 70%)",
];

const CALM_COLORS = [
  "hsl(220, 30%, 45%)",
  "hsl(240, 25%, 50%)",
  "hsl(200, 30%, 48%)",
  "hsl(260, 25%, 50%)",
  "hsl(210, 20%, 55%)",
  "hsl(230, 25%, 48%)",
  "hsl(250, 20%, 52%)",
  "hsl(215, 25%, 45%)",
];

interface Bloom {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface ColorWorldProps {
  calmMode?: boolean;
  onProgress?: () => void;
}

const ColorWorld = ({ calmMode = false, onProgress }: ColorWorldProps) => {
  const palette = calmMode ? CALM_COLORS : COLORS;
  const [bgColor, setBgColor] = useState(palette[0]);
  const [blooms, setBlooms] = useState<Bloom[]>([]);
  const colorIndex = useRef(0);
  const bloomId = useRef(0);
  const { trackEvent, flush } = useAnalytics("color");

  useEffect(() => () => { flush(); }, [flush]);

  const addBloom = useCallback((x: number, y: number) => {
    colorIndex.current = (colorIndex.current + 1) % palette.length;
    const newColor = palette[colorIndex.current];
    setBgColor(newColor);
    playSound("chime");
    if (navigator.vibrate) navigator.vibrate(10);
    trackEvent("tap", x, y, { color: newColor });
    onProgress?.();

    const id = bloomId.current++;
    const maxBlooms = calmMode ? 4 : 8;
    setBlooms((prev) => [...prev.slice(-maxBlooms), { id, x, y, color: newColor }]);

    const dur = calmMode ? 3000 : 1500;
    setTimeout(() => setBlooms((prev) => prev.filter((b) => b.id !== id)), dur);
  }, [palette, calmMode, trackEvent, onProgress]);

  const handleInteraction = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    addBloom(e.clientX - rect.left, e.clientY - rect.top);
  }, [addBloom]);

  const bloomDuration = calmMode ? "3s" : "1.5s";

  return (
    <div
      className="fixed inset-0 overflow-hidden cursor-pointer"
      style={{
        backgroundColor: bgColor,
        transition: `background-color ${calmMode ? "1.4s" : "0.7s"}`,
        touchAction: "manipulation",
        overscrollBehavior: "none",
      }}
      onPointerDown={handleInteraction}
      role="application"
      aria-label="Color World — tap to create color blooms"
    >
      {blooms.map((bloom) => (
        <div
          key={bloom.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: bloom.x - 40,
            top: bloom.y - 40,
            width: 80,
            height: 80,
            backgroundColor: bloom.color,
            animation: `bloom ${bloomDuration} ease-out forwards`,
            filter: "blur(8px)",
          }}
        />
      ))}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-32 h-32 rounded-full animate-gentle-pulse opacity-20"
          style={{ backgroundColor: "white" }}
        />
      </div>
    </div>
  );
};

export default ColorWorld;
