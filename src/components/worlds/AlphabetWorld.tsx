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
];

const CALM_COLORS = [
  "hsl(220, 30%, 45%)",
  "hsl(240, 25%, 50%)",
  "hsl(200, 30%, 48%)",
  "hsl(260, 25%, 50%)",
  "hsl(210, 20%, 55%)",
  "hsl(230, 25%, 48%)",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface LetterObj {
  id: number;
  letter: string;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

interface AlphabetWorldProps {
  calmMode?: boolean;
}

const speakLetter = (letter: string) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.rate = 0.75;
    utterance.pitch = 1.3;
    utterance.volume = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const friendly =
      voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (friendly) utterance.voice = friendly;
    window.speechSynthesis.speak(utterance);
  }
};

const AlphabetWorld = ({ calmMode = false }: AlphabetWorldProps) => {
  const palette = calmMode ? CALM_COLORS : COLORS;
  const [letters, setLetters] = useState<LetterObj[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showLetter, setShowLetter] = useState(false);
  const objId = useRef(0);
  const displayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { trackEvent, flush } = useAnalytics("alphabet");

  useEffect(() => () => { flush(); }, [flush]);

  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
  }, []);

  const handleTap = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

      const addAt = (cx: number, cy: number) => {
        const id = objId.current++;
        const size = 48 + Math.random() * 32;
        const letter = ALPHABET[currentIdx % ALPHABET.length];
        const color = palette[currentIdx % palette.length];

        const obj: LetterObj = {
          id,
          letter,
          x: cx - size / 2,
          y: cy - size / 2,
          color,
          size,
          rotation: Math.random() * 20 - 10,
        };

        const maxLetters = calmMode ? 10 : 20;
        setLetters((prev) => [...prev.slice(-(maxLetters - 1)), obj]);

        speakLetter(letter);
        playSound("chime");
        if (navigator.vibrate) navigator.vibrate(10);
        trackEvent("tap", cx, cy, { letter });

        setShowLetter(true);
        if (displayTimer.current) clearTimeout(displayTimer.current);
        displayTimer.current = setTimeout(() => setShowLetter(false), 2000);

        setCurrentIdx((i) => (i + 1) % ALPHABET.length);
      };

      if ("touches" in e) {
        for (let i = 0; i < e.touches.length; i++) {
          addAt(e.touches[i].clientX - rect.left, e.touches[i].clientY - rect.top);
        }
      } else {
        addAt(e.clientX - rect.left, e.clientY - rect.top);
      }
    },
    [palette, calmMode, currentIdx, trackEvent]
  );

  const currentLetter = ALPHABET[currentIdx === 0 && letters.length > 0 ? ALPHABET.length - 1 : (currentIdx - 1 + ALPHABET.length) % ALPHABET.length];

  return (
    <div
      className="fixed inset-0 overflow-hidden cursor-pointer"
      style={{
        backgroundColor: calmMode ? "hsl(230, 25%, 18%)" : "hsl(30, 50%, 97%)",
        touchAction: "manipulation",
        overscrollBehavior: "none",
      }}
      onTouchStart={handleTap}
      onClick={handleTap}
      role="application"
      aria-label="Alphabet World — tap to reveal letters"
    >
      {/* Big letter display */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all"
        style={{
          opacity: showLetter ? 1 : 0.12,
          transform: `translate(-50%, -50%) scale(${showLetter ? 1.1 : 1})`,
          transition: `all ${calmMode ? "0.8s" : "0.4s"} ease-out`,
        }}
      >
        <span
          className="font-nunito font-extrabold leading-none"
          style={{
            fontSize: "clamp(6rem, 22vw, 14rem)",
            color: letters.length > 0 ? letters[letters.length - 1].color : palette[0],
            textShadow: "0 4px 24px rgba(0,0,0,0.08)",
            transition: "color 0.3s",
          }}
        >
          {letters.length > 0 ? currentLetter : "A"}
        </span>
      </div>

      {/* Scattered letters */}
      {letters.map((obj) => (
        <div
          key={obj.id}
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            left: obj.x,
            top: obj.y,
            width: obj.size,
            height: obj.size,
            transform: `rotate(${obj.rotation}deg)`,
            animation: `bounce-in ${calmMode ? "0.8s" : "0.4s"} ease-out forwards`,
          }}
        >
          <span
            className="font-nunito font-extrabold"
            style={{
              fontSize: obj.size * 0.7,
              color: obj.color,
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.12))",
            }}
          >
            {obj.letter}
          </span>
        </div>
      ))}

      {/* Empty state */}
      {letters.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 opacity-30">
            <span className="text-6xl">🔤</span>
            <span className="font-nunito text-foreground/50 text-sm">Tap to learn letters!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlphabetWorld;
