import { useState, useCallback, useRef, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { useAnalytics } from "@/hooks/useAnalytics";

const OBJECT_COLORS = [
  "hsl(350, 70%, 65%)",
  "hsl(200, 70%, 72%)",
  "hsl(160, 50%, 65%)",
  "hsl(270, 60%, 75%)",
  "hsl(45, 90%, 65%)",
  "hsl(20, 80%, 75%)",
];

const CALM_COLORS = [
  "hsl(220, 30%, 45%)",
  "hsl(240, 25%, 50%)",
  "hsl(200, 30%, 48%)",
  "hsl(260, 25%, 50%)",
  "hsl(210, 20%, 55%)",
  "hsl(230, 25%, 48%)",
];

const SHAPES = ["circle", "star", "heart", "diamond"] as const;

interface CountObject {
  id: number;
  x: number;
  y: number;
  color: string;
  shape: typeof SHAPES[number];
  size: number;
  rotation: number;
}

interface NumberWorldProps {
  calmMode?: boolean;
}

const speakNumber = (n: number) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(n));
    utterance.rate = 0.8;
    utterance.pitch = 1.3;
    utterance.volume = 0.8;
    // Prefer a friendly voice
    const voices = window.speechSynthesis.getVoices();
    const friendly = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (friendly) utterance.voice = friendly;
    window.speechSynthesis.speak(utterance);
  }
};

const ObjectSVG = ({ shape, color, size }: { shape: string; color: string; size: number }) => {
  const half = size / 2;
  switch (shape) {
    case "circle":
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={half} cy={half} r={half - 4} fill={color} />
        </svg>
      );
    case "star": {
      const points = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 72 - 90) * (Math.PI / 180);
        const innerAngle = ((i * 72 + 36) - 90) * (Math.PI / 180);
        const outerR = half - 4;
        const innerR = outerR * 0.4;
        points.push(`${half + outerR * Math.cos(outerAngle)},${half + outerR * Math.sin(outerAngle)}`);
        points.push(`${half + innerR * Math.cos(innerAngle)},${half + innerR * Math.sin(innerAngle)}`);
      }
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon points={points.join(" ")} fill={color} />
        </svg>
      );
    }
    case "heart": {
      const s = size * 0.85;
      const ox = (size - s) / 2;
      const oy = (size - s) / 2 + 4;
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path
            d={`M ${size / 2} ${oy + s * 0.85}
              C ${ox} ${oy + s * 0.5}, ${ox} ${oy},
                ${size / 2} ${oy + s * 0.25}
              C ${ox + s} ${oy}, ${ox + s} ${oy + s * 0.5},
                ${size / 2} ${oy + s * 0.85} Z`}
            fill={color}
          />
        </svg>
      );
    }
    case "diamond":
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon points={`${half},4 ${size - 4},${half} ${half},${size - 4} 4,${half}`} fill={color} />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={half} cy={half} r={half - 4} fill={color} />
        </svg>
      );
  }
};

const NumberWorld = ({ calmMode = false }: NumberWorldProps) => {
  const palette = calmMode ? CALM_COLORS : OBJECT_COLORS;
  const [objects, setObjects] = useState<CountObject[]>([]);
  const [count, setCount] = useState(0);
  const [showNumber, setShowNumber] = useState(false);
  const objId = useRef(0);
  const numberTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { trackEvent, flush } = useAnalytics("number");

  useEffect(() => () => { flush(); }, [flush]);

  // Preload speech synthesis voices
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    const addAtPoint = (cx: number, cy: number) => {
      const id = objId.current++;
      const size = 50 + Math.random() * 30;
      const newObj: CountObject = {
        id,
        x: cx - size / 2,
        y: cy - size / 2,
        color: palette[Math.floor(Math.random() * palette.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        size,
        rotation: Math.random() * 30 - 15,
      };

      const maxObjects = calmMode ? 10 : 20;
      setObjects((prev) => {
        if (prev.length >= maxObjects) return [newObj];
        return [...prev, newObj];
      });

      setCount((prev) => {
        const next = prev >= maxObjects ? 1 : prev + 1;

        // Speak the number
        speakNumber(next);
        playSound("pop");
        if (navigator.vibrate) navigator.vibrate(10);
        trackEvent("tap", cx, cy, { count: next });

        // Flash the number display
        setShowNumber(true);
        if (numberTimer.current) clearTimeout(numberTimer.current);
        numberTimer.current = setTimeout(() => setShowNumber(false), 2000);

        // Reset when we wrap
        if (next === 1) {
          setObjects([newObj]);
        }

        return next;
      });
    };

    if ("touches" in e) {
      for (let i = 0; i < e.touches.length; i++) {
        addAtPoint(
          e.touches[i].clientX - rect.left,
          e.touches[i].clientY - rect.top
        );
      }
    } else {
      addAtPoint(e.clientX - rect.left, e.clientY - rect.top);
    }
  }, [palette, calmMode, trackEvent]);

  return (
    <div
      className="fixed inset-0 overflow-hidden cursor-pointer"
      style={{
        backgroundColor: calmMode ? "hsl(230, 25%, 18%)" : "hsl(50, 50%, 97%)",
        touchAction: "manipulation",
        overscrollBehavior: "none",
      }}
      onTouchStart={handleTap}
      onClick={handleTap}
      role="application"
      aria-label="Number World — tap to count objects"
    >
      {/* Count display */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center transition-all"
        style={{
          opacity: showNumber ? 1 : 0.15,
          transform: `translate(-50%, -50%) scale(${showNumber ? 1.1 : 1})`,
          transition: `all ${calmMode ? "0.8s" : "0.4s"} ease-out`,
        }}
      >
        <span
          className="font-nunito font-extrabold leading-none"
          style={{
            fontSize: "clamp(5rem, 20vw, 12rem)",
            color: count > 0 ? palette[(count - 1) % palette.length] : palette[0],
            textShadow: "0 4px 20px rgba(0,0,0,0.08)",
            transition: "color 0.3s",
          }}
        >
          {count}
        </span>
      </div>

      {/* Objects */}
      {objects.map((obj) => (
        <div
          key={obj.id}
          className="absolute pointer-events-none"
          style={{
            left: obj.x,
            top: obj.y,
            transform: `rotate(${obj.rotation}deg)`,
            animation: `bounce-in ${calmMode ? "0.8s" : "0.4s"} ease-out forwards`,
            filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.1))",
          }}
        >
          <ObjectSVG shape={obj.shape} color={obj.color} size={obj.size} />
        </div>
      ))}

      {/* Empty state hint */}
      {objects.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 opacity-30">
            <span className="text-6xl">🔢</span>
            <span className="font-nunito text-foreground/50 text-sm">Tap to count!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NumberWorld;
