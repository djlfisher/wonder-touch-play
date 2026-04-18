import { useState, useCallback, useRef, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAINarration } from "@/hooks/useAINarration";
import SurpriseButton from "@/components/SurpriseButton";

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
  onProgress?: (uniqueLetters: number) => void;
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

const AlphabetWorld = ({ calmMode = false, onProgress }: AlphabetWorldProps) => {
  const palette = calmMode ? CALM_COLORS : COLORS;
  const [letters, setLetters] = useState<LetterObj[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showLetter, setShowLetter] = useState(false);
  const discoveredRef = useRef(new Set<string>());
  const objId = useRef(0);
  const displayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { trackEvent, flush } = useAnalytics("alphabet");
  const { narrate } = useAINarration();
  const tapCountRef = useRef(0);

  useEffect(() => () => { flush(); }, [flush]);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const handleTap = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

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

      discoveredRef.current.add(letter);
      onProgress?.(discoveredRef.current.size);

      speakLetter(letter);
      playSound("chime");
      if (navigator.vibrate) navigator.vibrate(10);
      trackEvent("tap", cx, cy, { letter });

      // Adaptive AI narration ~ every 5th tap, after the spoken letter
      tapCountRef.current += 1;
      if (tapCountRef.current % 5 === 0) {
        setTimeout(() => {
          narrate(`alpha:${letter}`, `The toddler tapped the letter ${letter}. Give a delighted one-line phrase.`);
        }, 700);
      }

      setShowLetter(true);
      if (displayTimer.current) clearTimeout(displayTimer.current);
      displayTimer.current = setTimeout(() => setShowLetter(false), 2000);

      setCurrentIdx((i) => (i + 1) % ALPHABET.length);
    },
    [palette, calmMode, currentIdx, trackEvent, onProgress, narrate]
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
      onPointerDown={handleTap}
      role="application"
      aria-label="Alphabet World — tap to reveal letters"
    >
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

      {letters.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 opacity-30">
            <span className="text-6xl">🔤</span>
            <span className="font-nunito text-foreground/50 text-sm">Tap to learn letters!</span>
          </div>
        </div>
      )}

      <SurpriseButton
        world="alphabet"
        buildPrompt={() => {
          const last = letters.length > 0 ? letters[letters.length - 1].letter : currentLetter;
          return `A bright cheerful object that starts with the letter ${last}, simple cartoon style for toddlers.`;
        }}
      />
    </div>
  );
};

export default AlphabetWorld;
