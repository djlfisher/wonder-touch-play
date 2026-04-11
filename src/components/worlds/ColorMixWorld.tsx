import { useState, useCallback, useRef, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { useAnalytics } from "@/hooks/useAnalytics";

const BASE_COLORS = [
  { name: "Red", hsl: [0, 70, 60], css: "hsl(0, 70%, 60%)" },
  { name: "Blue", hsl: [220, 70, 55], css: "hsl(220, 70%, 55%)" },
  { name: "Yellow", hsl: [50, 90, 60], css: "hsl(50, 90%, 60%)" },
  { name: "Green", hsl: [140, 55, 50], css: "hsl(140, 55%, 50%)" },
  { name: "Purple", hsl: [280, 60, 55], css: "hsl(280, 60%, 55%)" },
  { name: "Orange", hsl: [30, 85, 55], css: "hsl(30, 85%, 55%)" },
];

const CALM_BASE = [
  { name: "Red", hsl: [0, 40, 45], css: "hsl(0, 40%, 45%)" },
  { name: "Blue", hsl: [220, 40, 42], css: "hsl(220, 40%, 42%)" },
  { name: "Yellow", hsl: [50, 55, 48], css: "hsl(50, 55%, 48%)" },
  { name: "Green", hsl: [140, 35, 40], css: "hsl(140, 35%, 40%)" },
  { name: "Purple", hsl: [280, 35, 42], css: "hsl(280, 35%, 42%)" },
  { name: "Orange", hsl: [30, 50, 42], css: "hsl(30, 50%, 42%)" },
];

const MIX_RESULTS: Record<string, { name: string; h: number; s: number; l: number }> = {
  "Red+Blue": { name: "Purple!", h: 280, s: 60, l: 50 },
  "Blue+Red": { name: "Purple!", h: 280, s: 60, l: 50 },
  "Red+Yellow": { name: "Orange!", h: 30, s: 85, l: 55 },
  "Yellow+Red": { name: "Orange!", h: 30, s: 85, l: 55 },
  "Blue+Yellow": { name: "Green!", h: 140, s: 55, l: 50 },
  "Yellow+Blue": { name: "Green!", h: 140, s: 55, l: 50 },
  "Red+Green": { name: "Brown!", h: 30, s: 40, l: 38 },
  "Green+Red": { name: "Brown!", h: 30, s: 40, l: 38 },
  "Blue+Orange": { name: "Brown!", h: 25, s: 35, l: 40 },
  "Orange+Blue": { name: "Brown!", h: 25, s: 35, l: 40 },
  "Yellow+Purple": { name: "Brown!", h: 20, s: 35, l: 42 },
  "Purple+Yellow": { name: "Brown!", h: 20, s: 35, l: 42 },
  "Red+Orange": { name: "Red-Orange!", h: 15, s: 80, l: 55 },
  "Orange+Red": { name: "Red-Orange!", h: 15, s: 80, l: 55 },
  "Yellow+Green": { name: "Lime!", h: 90, s: 60, l: 52 },
  "Green+Yellow": { name: "Lime!", h: 90, s: 60, l: 52 },
  "Blue+Green": { name: "Teal!", h: 180, s: 50, l: 45 },
  "Green+Blue": { name: "Teal!", h: 180, s: 50, l: 45 },
  "Blue+Purple": { name: "Indigo!", h: 250, s: 55, l: 48 },
  "Purple+Blue": { name: "Indigo!", h: 250, s: 55, l: 48 },
  "Red+Purple": { name: "Magenta!", h: 320, s: 60, l: 52 },
  "Purple+Red": { name: "Magenta!", h: 320, s: 60, l: 52 },
  "Orange+Green": { name: "Olive!", h: 70, s: 45, l: 42 },
  "Green+Orange": { name: "Olive!", h: 70, s: 45, l: 42 },
  "Orange+Purple": { name: "Russet!", h: 10, s: 45, l: 40 },
  "Purple+Orange": { name: "Russet!", h: 10, s: 45, l: 40 },
  "Yellow+Orange": { name: "Gold!", h: 42, s: 85, l: 55 },
  "Orange+Yellow": { name: "Gold!", h: 42, s: 85, l: 55 },
  "Green+Purple": { name: "Slate!", h: 200, s: 25, l: 42 },
  "Purple+Green": { name: "Slate!", h: 200, s: 25, l: 42 },
};

interface DragBlob {
  id: number;
  colorIdx: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
}

interface MixResult {
  id: number;
  name: string;
  css: string;
  x: number;
  y: number;
}

interface ColorMixWorldProps {
  calmMode?: boolean;
}

const speakColor = (name: string) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(name);
    u.rate = 0.8;
    u.pitch = 1.2;
    u.volume = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((v) => v.lang.startsWith("en")) || undefined;
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }
};

const ColorMixWorld = ({ calmMode = false }: ColorMixWorldProps) => {
  const palette = calmMode ? CALM_BASE : BASE_COLORS;
  const [dragging, setDragging] = useState<DragBlob | null>(null);
  const [results, setResults] = useState<MixResult[]>([]);
  const [bgFlash, setBgFlash] = useState<string | null>(null);
  const resultId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { trackEvent, flush } = useAnalytics("colormix");

  useEffect(() => () => { flush(); }, [flush]);
  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  const blobSize = 80;
  const padSize = 100;

  // Layout: 3 blobs on left, 3 on right
  const getBlobPosition = (idx: number) => {
    const col = idx < 3 ? 0 : 1;
    const row = idx % 3;
    const vw = typeof window !== "undefined" ? window.innerWidth : 400;
    const vh = typeof window !== "undefined" ? window.innerHeight : 700;
    const x = col === 0 ? vw * 0.12 : vw * 0.88 - padSize;
    const yStart = vh * 0.2;
    const gap = Math.min((vh * 0.6) / 3, 140);
    const y = yStart + row * gap;
    return { x, y };
  };

  const checkOverlap = (dragIdx: number, dragX: number, dragY: number) => {
    for (let i = 0; i < palette.length; i++) {
      if (i === dragIdx) continue;
      const pos = getBlobPosition(i);
      const cx = pos.x + padSize / 2;
      const cy = pos.y + padSize / 2;
      const dx = dragX + blobSize / 2 - cx;
      const dy = dragY + blobSize / 2 - cy;
      if (Math.sqrt(dx * dx + dy * dy) < blobSize * 0.9) {
        return i;
      }
    }
    return -1;
  };

  const handlePointerDown = useCallback(
    (idx: number, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const pos = getBlobPosition(idx);
      setDragging({
        id: e.pointerId,
        colorIdx: idx,
        x: pos.x + (padSize - blobSize) / 2,
        y: pos.y + (padSize - blobSize) / 2,
        originX: pos.x + (padSize - blobSize) / 2,
        originY: pos.y + (padSize - blobSize) / 2,
      });
    },
    [palette]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || e.pointerId !== dragging.id) return;
      setDragging((d) =>
        d ? { ...d, x: e.clientX - blobSize / 2, y: e.clientY - blobSize / 2 } : null
      );
    },
    [dragging]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || e.pointerId !== dragging.id) return;
      const target = checkOverlap(dragging.colorIdx, dragging.x, dragging.y);
      if (target >= 0) {
        const key = `${palette[dragging.colorIdx].name}+${palette[target].name}`;
        const mix = MIX_RESULTS[key];
        if (mix) {
          const css = `hsl(${mix.h}, ${mix.s}%, ${mix.l}%)`;
          const pos = getBlobPosition(target);
          const id = resultId.current++;
          setResults((prev) => [...prev.slice(-6), { id, name: mix.name, css, x: pos.x, y: pos.y - 60 }]);
          setBgFlash(css);
          setTimeout(() => setBgFlash(null), 1200);
          playSound("sparkle");
          if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
          speakColor(mix.name.replace("!", ""));
          trackEvent("mix", pos.x, pos.y, {
            from: palette[dragging.colorIdx].name,
            to: palette[target].name,
            result: mix.name,
          });
          setTimeout(() => setResults((prev) => prev.filter((r) => r.id !== id)), 3000);
        } else {
          // Same color or unknown combo
          playSound("pop");
          const sameName = palette[dragging.colorIdx].name;
          speakColor(sameName);
        }
      }
      setDragging(null);
    },
    [dragging, palette, trackEvent]
  );

  const baseBg = calmMode ? "hsl(230, 25%, 18%)" : "hsl(40, 40%, 96%)";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{
        backgroundColor: bgFlash || baseBg,
        transition: `background-color ${calmMode ? "1.5s" : "0.8s"} ease-out`,
        touchAction: "none",
        overscrollBehavior: "none",
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="application"
      aria-label="Color Mixing World — drag colors together to mix them"
    >
      {/* Color blobs at resting positions */}
      {palette.map((c, idx) => {
        const pos = getBlobPosition(idx);
        const isBeingDragged = dragging?.colorIdx === idx;
        return (
          <div
            key={idx}
            className="absolute flex flex-col items-center gap-1 select-none"
            style={{
              left: pos.x,
              top: pos.y,
              width: padSize,
              height: padSize,
              opacity: isBeingDragged ? 0.3 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <div
              className="rounded-full cursor-grab active:cursor-grabbing shadow-lg"
              style={{
                width: blobSize,
                height: blobSize,
                backgroundColor: c.css,
                margin: "0 auto",
                boxShadow: `0 6px 20px ${c.css}40`,
              }}
              onPointerDown={(e) => handlePointerDown(idx, e)}
            />
            <span
              className="font-nunito font-bold text-xs text-center pointer-events-none"
              style={{ color: calmMode ? "hsl(0,0%,70%)" : "hsl(0,0%,35%)" }}
            >
              {c.name}
            </span>
          </div>
        );
      })}

      {/* Dragging blob */}
      {dragging && (
        <div
          className="fixed rounded-full pointer-events-none z-30"
          style={{
            left: dragging.x,
            top: dragging.y,
            width: blobSize,
            height: blobSize,
            backgroundColor: palette[dragging.colorIdx].css,
            boxShadow: `0 8px 30px ${palette[dragging.colorIdx].css}60`,
            transform: "scale(1.15)",
            transition: "transform 0.1s",
          }}
        />
      )}

      {/* Mix results */}
      {results.map((r) => (
        <div
          key={r.id}
          className="absolute z-20 flex flex-col items-center pointer-events-none"
          style={{
            left: r.x,
            top: r.y,
            animation: `float 3s ease-out forwards`,
          }}
        >
          <div
            className="rounded-full mb-2"
            style={{
              width: 60,
              height: 60,
              backgroundColor: r.css,
              boxShadow: `0 4px 20px ${r.css}50`,
              animation: `bounce-in ${calmMode ? "0.8s" : "0.4s"} ease-out`,
            }}
          />
          <span
            className="font-nunito font-extrabold text-lg"
            style={{
              color: r.css,
              textShadow: "0 1px 8px rgba(0,0,0,0.1)",
            }}
          >
            {r.name}
          </span>
        </div>
      ))}

      {/* Center hint */}
      {results.length === 0 && !dragging && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 opacity-30">
            <span className="text-5xl">🎨</span>
            <span className="font-nunito text-foreground/50 text-sm text-center px-8">
              Drag a color onto another to mix!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorMixWorld;
