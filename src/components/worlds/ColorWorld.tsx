import { useState, useCallback, useRef } from "react";

const COLORS = [
  "hsl(350, 70%, 65%)", // coral
  "hsl(200, 70%, 72%)", // sky
  "hsl(160, 50%, 65%)", // mint
  "hsl(270, 60%, 75%)", // lavender
  "hsl(45, 90%, 65%)",  // sunny
  "hsl(20, 80%, 75%)",  // peach
  "hsl(180, 60%, 60%)", // teal
  "hsl(320, 60%, 70%)", // pink
];

interface Bloom {
  id: number;
  x: number;
  y: number;
  color: string;
}

const ColorWorld = () => {
  const [bgColor, setBgColor] = useState(COLORS[0]);
  const [blooms, setBlooms] = useState<Bloom[]>([]);
  const colorIndex = useRef(0);
  const bloomId = useRef(0);

  const handleInteraction = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let x: number, y: number;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    colorIndex.current = (colorIndex.current + 1) % COLORS.length;
    const newColor = COLORS[colorIndex.current];
    setBgColor(newColor);

    const id = bloomId.current++;
    setBlooms((prev) => [...prev.slice(-8), { id, x, y, color: newColor }]);

    setTimeout(() => {
      setBlooms((prev) => prev.filter((b) => b.id !== id));
    }, 1500);
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden cursor-pointer transition-colors duration-700"
      style={{ backgroundColor: bgColor }}
      onTouchStart={handleInteraction}
      onClick={handleInteraction}
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
            animation: "bloom 1.5s ease-out forwards",
            filter: "blur(8px)",
          }}
        />
      ))}

      {/* Subtle hint circle */}
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
