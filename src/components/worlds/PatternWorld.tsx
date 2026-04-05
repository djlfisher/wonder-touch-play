import { useState, useCallback, useEffect } from "react";
import { playSound } from "@/lib/sounds";

const PATTERNS = [
  { name: "dots", colors: ["hsl(350,70%,65%)", "hsl(45,90%,65%)", "hsl(200,70%,72%)"] },
  { name: "waves", colors: ["hsl(200,70%,72%)", "hsl(160,50%,65%)", "hsl(270,60%,75%)"] },
  { name: "stripes", colors: ["hsl(45,90%,65%)", "hsl(20,80%,75%)", "hsl(350,70%,65%)"] },
  { name: "checkers", colors: ["hsl(270,60%,75%)", "hsl(350,70%,65%)", "hsl(160,50%,65%)"] },
];

const PatternWorld = () => {
  const [patternIdx, setPatternIdx] = useState(0);
  const [phase, setPhase] = useState(0);
  const [taps, setTaps] = useState(0);

  const pattern = PATTERNS[patternIdx];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => p + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setTaps((t) => t + 1);
    playSound("tone");
    if (taps % 5 === 4) {
      setPatternIdx((i) => (i + 1) % PATTERNS.length);
    }
  }, [taps]);

  const renderDots = () => {
    const dots = [];
    const cols = 6;
    const rows = 10;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const colorIdx = (r + c + phase) % pattern.colors.length;
        const delay = (r + c) * 0.1;
        dots.push(
          <div
            key={`${r}-${c}`}
            className="rounded-full transition-all duration-700"
            style={{
              width: 36 + (taps % 3) * 8,
              height: 36 + (taps % 3) * 8,
              backgroundColor: pattern.colors[colorIdx],
              animationDelay: `${delay}s`,
              animation: "gentle-pulse 2s ease-in-out infinite",
            }}
          />
        );
      }
    }
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {dots}
      </div>
    );
  };

  const renderWaves = () => {
    const waves = [];
    for (let i = 0; i < 8; i++) {
      const colorIdx = (i + phase) % pattern.colors.length;
      waves.push(
        <div
          key={i}
          className="w-full rounded-full transition-all duration-1000"
          style={{
            height: 30 + Math.sin((phase + i) * 0.5) * 15 + taps * 2,
            backgroundColor: pattern.colors[colorIdx],
            opacity: 0.7,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      );
    }
    return <div className="flex flex-col gap-3 w-full px-8">{waves}</div>;
  };

  const renderStripes = () => {
    const stripes = [];
    for (let i = 0; i < 12; i++) {
      const colorIdx = (i + phase) % pattern.colors.length;
      stripes.push(
        <div
          key={i}
          className="flex-1 transition-all duration-700 rounded-lg"
          style={{
            backgroundColor: pattern.colors[colorIdx],
            transform: `scaleY(${0.8 + Math.sin((phase + i) * 0.4) * 0.2})`,
          }}
        />
      );
    }
    return <div className="flex gap-2 w-full h-full px-4 py-8">{stripes}</div>;
  };

  const renderCheckers = () => {
    const cells = [];
    const size = 5;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const colorIdx = ((r + c + phase) % 2 === 0 ? 0 : 1 + ((r + c) % (pattern.colors.length - 1)));
        cells.push(
          <div
            key={`${r}-${c}`}
            className="rounded-2xl transition-all duration-700"
            style={{
              backgroundColor: pattern.colors[colorIdx % pattern.colors.length],
              aspectRatio: "1",
              transform: `rotate(${(phase + r + c) * 10 % 45}deg) scale(${0.85 + Math.sin((phase + r) * 0.5) * 0.15})`,
            }}
          />
        );
      }
    }
    return (
      <div className="grid gap-3 p-6" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {cells}
      </div>
    );
  };

  const renderers: Record<string, () => React.ReactNode> = {
    dots: renderDots,
    waves: renderWaves,
    stripes: renderStripes,
    checkers: renderCheckers,
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden cursor-pointer flex items-center justify-center"
      style={{ backgroundColor: "hsl(40, 50%, 97%)" }}
      onTouchStart={handleTap}
      onClick={handleTap}
    >
      {renderers[pattern.name]?.()}
    </div>
  );
};

export default PatternWorld;
