import { useState, useCallback, useRef, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

// Pentatonic scale — no dissonant combinations
const NOTES = [
  { freq: 262, label: "C", color: "hsl(350, 70%, 65%)" },
  { freq: 294, label: "D", color: "hsl(200, 70%, 72%)" },
  { freq: 330, label: "E", color: "hsl(160, 50%, 65%)" },
  { freq: 392, label: "G", color: "hsl(270, 60%, 75%)" },
  { freq: 440, label: "A", color: "hsl(45, 90%, 65%)" },
  { freq: 523, label: "C2", color: "hsl(20, 80%, 75%)" },
  { freq: 587, label: "D2", color: "hsl(350, 60%, 75%)" },
  { freq: 659, label: "E2", color: "hsl(200, 60%, 78%)" },
];

interface Ripple {
  id: number;
  noteIdx: number;
}

interface MusicWorldProps {
  calmMode?: boolean;
}

const MusicWorld = ({ calmMode = false }: MusicWorldProps) => {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { trackEvent, flush } = useAnalytics("music");

  useEffect(() => () => { flush(); }, [flush]);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const playNote = useCallback((freq: number) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const vol = calmMode ? 0.08 : 0.15;
      const dur = calmMode ? 1.2 : 0.8;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {}
  }, [calmMode, getCtx]);

  const handlePadTap = useCallback((idx: number, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playNote(NOTES[idx].freq);
    if (navigator.vibrate) navigator.vibrate(10);
    trackEvent("note", undefined, undefined, { note: NOTES[idx].label });

    setActiveNotes((prev) => new Set(prev).add(idx));
    setTimeout(() => setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    }), 300);

    const id = rippleId.current++;
    setRipples((prev) => [...prev.slice(-8), { id, noteIdx: idx }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 800);
  }, [playNote, trackEvent]);

  return (
    <div
      className="fixed inset-0 overflow-hidden flex items-center justify-center"
      style={{
        backgroundColor: calmMode ? "hsl(240, 20%, 20%)" : "hsl(280, 30%, 96%)",
        touchAction: "manipulation",
      }}
    >
      <div className="grid grid-cols-2 gap-4 p-6 w-full max-w-sm">
        {NOTES.map((note, idx) => (
          <button
            key={idx}
            className="relative aspect-square rounded-3xl flex items-center justify-center transition-transform duration-150"
            style={{
              backgroundColor: note.color,
              transform: activeNotes.has(idx) ? "scale(0.92)" : "scale(1)",
              boxShadow: activeNotes.has(idx)
                ? `0 0 40px ${note.color}, 0 0 80px ${note.color}`
                : `0 8px 24px rgba(0,0,0,0.1)`,
              opacity: calmMode ? 0.7 : 1,
            }}
            onClick={(e) => handlePadTap(idx, e)}
            onTouchStart={(e) => handlePadTap(idx, e)}
            aria-label={`Play note ${note.label}`}
          >
            {/* Ripple effect */}
            {ripples
              .filter((r) => r.noteIdx === idx)
              .map((r) => (
                <div
                  key={r.id}
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  style={{
                    border: `3px solid ${note.color}`,
                    animation: "ripple 0.8s ease-out forwards",
                  }}
                />
              ))}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MusicWorld;
