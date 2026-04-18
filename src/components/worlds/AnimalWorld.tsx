import { useState, useCallback, useRef, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAINarration } from "@/hooks/useAINarration";
import SurpriseButton from "@/components/SurpriseButton";

const ANIMALS = [
  { name: "Cat", emoji: "🐱", sound: "Meow!", color: "hsl(350, 70%, 65%)", freq: 600, type: "sine" as OscillatorType },
  { name: "Dog", emoji: "🐶", sound: "Woof!", color: "hsl(30, 85%, 55%)", freq: 200, type: "sawtooth" as OscillatorType },
  { name: "Cow", emoji: "🐮", sound: "Moo!", color: "hsl(140, 55%, 50%)", freq: 130, type: "sawtooth" as OscillatorType },
  { name: "Duck", emoji: "🦆", sound: "Quack!", color: "hsl(50, 90%, 60%)", freq: 500, type: "square" as OscillatorType },
  { name: "Pig", emoji: "🐷", sound: "Oink!", color: "hsl(340, 60%, 72%)", freq: 300, type: "sawtooth" as OscillatorType },
  { name: "Frog", emoji: "🐸", sound: "Ribbit!", color: "hsl(140, 60%, 45%)", freq: 180, type: "square" as OscillatorType },
  { name: "Owl", emoji: "🦉", sound: "Hoot!", color: "hsl(270, 40%, 50%)", freq: 350, type: "sine" as OscillatorType },
  { name: "Bee", emoji: "🐝", sound: "Buzz!", color: "hsl(45, 90%, 55%)", freq: 220, type: "sawtooth" as OscillatorType },
  { name: "Lion", emoji: "🦁", sound: "Roar!", color: "hsl(30, 70%, 50%)", freq: 100, type: "sawtooth" as OscillatorType },
  { name: "Bird", emoji: "🐦", sound: "Tweet!", color: "hsl(200, 70%, 60%)", freq: 900, type: "sine" as OscillatorType },
  { name: "Sheep", emoji: "🐑", sound: "Baa!", color: "hsl(0, 0%, 75%)", freq: 400, type: "triangle" as OscillatorType },
  { name: "Horse", emoji: "🐴", sound: "Neigh!", color: "hsl(25, 50%, 45%)", freq: 250, type: "sawtooth" as OscillatorType },
];

interface AnimalWorldProps {
  calmMode?: boolean;
  onProgress?: (uniqueAnimals: number) => void;
}

const AnimalWorld = ({ calmMode = false, onProgress }: AnimalWorldProps) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [bouncing, setBouncing] = useState<Set<number>>(new Set());
  const discoveredRef = useRef(new Set<string>());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { trackEvent, flush } = useAnalytics("animals");
  const { narrate } = useAINarration();
  const tapCountRef = useRef(0);

  useEffect(() => () => { flush(); }, [flush]);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const playAnimalSound = useCallback((animal: typeof ANIMALS[0]) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = animal.type;
      const vol = calmMode ? 0.08 : 0.15;
      const dur = calmMode ? 0.8 : 0.5;

      osc.frequency.setValueAtTime(animal.freq, ctx.currentTime);
      if (animal.name === "Cat") {
        osc.frequency.exponentialRampToValueAtTime(animal.freq * 1.5, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(animal.freq * 0.8, ctx.currentTime + dur);
      } else if (animal.name === "Dog") {
        osc.frequency.setValueAtTime(animal.freq, ctx.currentTime);
        osc.frequency.setValueAtTime(animal.freq * 1.3, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(animal.freq, ctx.currentTime + 0.2);
      } else if (animal.name === "Bird" || animal.name === "Duck") {
        osc.frequency.exponentialRampToValueAtTime(animal.freq * 1.4, ctx.currentTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(animal.freq * 0.7, ctx.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(animal.freq * 1.2, ctx.currentTime + 0.25);
      } else if (animal.name === "Lion" || animal.name === "Cow") {
        osc.frequency.linearRampToValueAtTime(animal.freq * 0.7, ctx.currentTime + dur);
      } else if (animal.name === "Frog") {
        osc.frequency.setValueAtTime(animal.freq, ctx.currentTime);
        osc.frequency.setValueAtTime(animal.freq * 2, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(animal.freq, ctx.currentTime + 0.16);
      } else {
        osc.frequency.exponentialRampToValueAtTime(animal.freq * 0.6, ctx.currentTime + dur);
      }

      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.1);
    } catch {}
  }, [calmMode, getCtx]);

  const speakAnimalName = useCallback((name: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(name);
      u.rate = 0.8;
      u.pitch = 1.3;
      u.volume = 0.8;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((v) => v.lang.startsWith("en"));
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    }
  }, []);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const handleTap = useCallback(
    (idx: number, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const animal = ANIMALS[idx];

      playAnimalSound(animal);
      if (navigator.vibrate) navigator.vibrate(15);
      trackEvent("tap", undefined, undefined, { animal: animal.name });

      discoveredRef.current.add(animal.name);
      onProgress?.(discoveredRef.current.size);

      setActiveIdx(idx);
      setBouncing((prev) => new Set(prev).add(idx));

      setTimeout(() => speakAnimalName(animal.name), calmMode ? 600 : 350);

      tapCountRef.current += 1;
      if (tapCountRef.current % 4 === 0) {
        setTimeout(() => {
          narrate(`animal:${animal.name}`, `The toddler tapped a ${animal.name}. Give one delighted short phrase about the animal.`);
        }, calmMode ? 1500 : 1000);
      }

      setTimeout(() => {
        setActiveIdx((curr) => (curr === idx ? null : curr));
        setBouncing((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
      }, calmMode ? 1200 : 700);
    },
    [playAnimalSound, speakAnimalName, calmMode, trackEvent, onProgress, narrate]
  );

  const cols = typeof window !== "undefined" && window.innerWidth > 600 ? 4 : 3;

  return (
    <div
      className="fixed inset-0 overflow-hidden flex items-center justify-center"
      style={{
        backgroundColor: calmMode ? "hsl(230, 25%, 18%)" : "hsl(45, 50%, 96%)",
        touchAction: "manipulation",
        overscrollBehavior: "none",
        transition: "background-color 0.5s",
      }}
      role="application"
      aria-label="Animal Sounds World — tap animals to hear their sounds"
    >
      <div
        className="grid gap-3 p-4 w-full max-w-lg"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {ANIMALS.map((animal, idx) => (
          <button
            key={idx}
            className="relative flex flex-col items-center justify-center rounded-3xl p-3 transition-all"
            style={{
              backgroundColor: animal.color,
              opacity: calmMode ? 0.75 : 1,
              transform: bouncing.has(idx)
                ? "scale(1.15) rotate(-5deg)"
                : "scale(1) rotate(0deg)",
              boxShadow: activeIdx === idx
                ? `0 0 30px ${animal.color}, 0 8px 30px rgba(0,0,0,0.15)`
                : "0 4px 12px rgba(0,0,0,0.08)",
              transition: `transform ${calmMode ? "0.4s" : "0.2s"} ease-out, box-shadow 0.3s`,
              aspectRatio: "1",
              minHeight: "80px",
            }}
            onPointerDown={(e) => handleTap(idx, e)}
            aria-label={`${animal.name} — ${animal.sound}`}
          >
            <span
              className="leading-none"
              style={{
                fontSize: "clamp(2rem, 8vw, 3rem)",
                filter: bouncing.has(idx)
                  ? "drop-shadow(0 0 12px rgba(255,255,255,0.6))"
                  : "none",
                transition: "filter 0.2s",
              }}
            >
              {animal.emoji}
            </span>
            <span className="font-nunito font-bold text-primary-foreground text-xs mt-1">
              {animal.name}
            </span>

            {activeIdx === idx && (
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none z-10"
                style={{ animation: `slide-up 0.3s ease-out forwards` }}
              >
                <span
                  className="font-nunito font-extrabold text-sm px-3 py-1 rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    color: animal.color,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  {animal.sound}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      <SurpriseButton
        world="animals"
        buildPrompt={() => {
          const pool = ["panda","penguin","fox","koala","giraffe","zebra","elephant","monkey","rabbit","turtle","whale","dolphin"];
          const pick = pool[Math.floor(Math.random() * pool.length)];
          return `A friendly happy ${pick} for a toddler picture book, soft pastel background.`;
        }}
      />
    </div>
  );
};

export default AnimalWorld;
