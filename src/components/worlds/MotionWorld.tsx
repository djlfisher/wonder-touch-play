import { useState, useCallback, useEffect, useRef } from "react";
import { playSound } from "@/lib/sounds";
import { useAnalytics } from "@/hooks/useAnalytics";

const COLORS = [
  "hsl(350, 70%, 65%)",
  "hsl(200, 70%, 72%)",
  "hsl(160, 50%, 65%)",
  "hsl(270, 60%, 75%)",
  "hsl(45, 90%, 65%)",
  "hsl(20, 80%, 75%)",
];

interface FloatingObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: "circle" | "rounded-square";
  scale: number;
  glowing: boolean;
}

interface MotionWorldProps {
  calmMode?: boolean;
  onProgress?: () => void;
}

const MotionWorld = ({ calmMode = false, onProgress }: MotionWorldProps) => {
  const [objects, setObjects] = useState<FloatingObject[]>([]);
  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { trackEvent, flush } = useAnalytics("motion");
  const speedMultiplier = calmMode ? 0.4 : 1;

  useEffect(() => () => { flush(); }, [flush]);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const count = calmMode ? 5 : 8;
    const initial: FloatingObject[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * (w - 80),
      y: Math.random() * (h - 80),
      vx: (Math.random() - 0.5) * 0.8 * speedMultiplier,
      vy: (Math.random() - 0.5) * 0.8 * speedMultiplier,
      size: 50 + Math.random() * 40,
      color: COLORS[i % COLORS.length],
      shape: Math.random() > 0.5 ? "circle" : "rounded-square",
      scale: 1,
      glowing: false,
    }));
    setObjects(initial);
  }, [calmMode]);

  useEffect(() => {
    const animate = () => {
      setObjects((prev) =>
        prev.map((obj) => {
          let { x, y, vx, vy } = obj;
          const w = window.innerWidth;
          const h = window.innerHeight;
          x += vx;
          y += vy;
          if (x <= 0 || x >= w - obj.size) vx = -vx;
          if (y <= 0 || y >= h - obj.size) vy = -vy;
          return {
            ...obj,
            x: Math.max(0, Math.min(w - obj.size, x)),
            y: Math.max(0, Math.min(h - obj.size, y)),
            vx, vy,
            scale: obj.glowing ? obj.scale * 0.98 + 1 * 0.02 : obj.scale,
            glowing: obj.scale > 1.05 ? obj.glowing : false,
          };
        })
      );
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleObjectTap = useCallback((id: number, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    playSound("sparkle");
    if (navigator.vibrate) navigator.vibrate(10);
    trackEvent("object_tap", undefined, undefined, { objectId: id });
    onProgress?.();
    const pushForce = calmMode ? 1.5 : 3;
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? {
              ...obj,
              scale: 1.4,
              glowing: true,
              vx: (Math.random() - 0.5) * pushForce,
              vy: (Math.random() - 0.5) * pushForce,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
            }
          : obj
      )
    );
  }, [calmMode, trackEvent, onProgress]);

  const handleBgTap = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const pushForce = calmMode ? 0.7 : 1.5;
    setObjects((prev) =>
      prev.map((obj) => ({
        ...obj,
        vx: obj.vx + (Math.random() - 0.5) * pushForce,
        vy: obj.vy + (Math.random() - 0.5) * pushForce,
      }))
    );
  }, [calmMode]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden cursor-pointer"
      style={{
        backgroundColor: calmMode ? "hsl(230, 25%, 18%)" : "hsl(220, 30%, 96%)",
        touchAction: "manipulation",
        overscrollBehavior: "none",
      }}
      onPointerDown={handleBgTap}
      role="application"
      aria-label="Motion World — tap floating objects"
    >
      {objects.map((obj) => (
        <div
          key={obj.id}
          className="absolute"
          style={{
            left: obj.x,
            top: obj.y,
            width: obj.size,
            height: obj.size,
            backgroundColor: obj.color,
            borderRadius: obj.shape === "circle" ? "50%" : "25%",
            transform: `scale(${obj.scale})`,
            boxShadow: obj.glowing
              ? `0 0 30px ${obj.color}, 0 0 60px ${obj.color}`
              : `0 4px 16px rgba(0,0,0,0.08)`,
            transition: `box-shadow 0.5s, background-color 0.3s, transform 0.3s`,
            opacity: calmMode ? 0.75 : 1,
          }}
          onPointerDown={(e) => handleObjectTap(obj.id, e)}
        />
      ))}
    </div>
  );
};

export default MotionWorld;
