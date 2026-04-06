import { useState, useCallback, useRef, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { useAnalytics } from "@/hooks/useAnalytics";

const SHAPES = ["circle", "square", "triangle", "diamond", "star"] as const;
const COLORS = [
  "hsl(350, 70%, 65%)",
  "hsl(200, 70%, 72%)",
  "hsl(160, 50%, 65%)",
  "hsl(270, 60%, 75%)",
  "hsl(45, 90%, 65%)",
  "hsl(20, 80%, 75%)",
];

interface Shape {
  id: number;
  x: number;
  y: number;
  type: typeof SHAPES[number];
  color: string;
  size: number;
  rotation: number;
}

const ShapeSVG = ({ type, color, size }: { type: string; color: string; size: number }) => {
  const half = size / 2;
  switch (type) {
    case "circle":
      return <circle cx={half} cy={half} r={half - 4} fill={color} />;
    case "square":
      return <rect x={4} y={4} width={size - 8} height={size - 8} rx={8} fill={color} />;
    case "triangle":
      return <polygon points={`${half},4 ${size - 4},${size - 4} 4,${size - 4}`} fill={color} />;
    case "diamond":
      return <polygon points={`${half},4 ${size - 4},${half} ${half},${size - 4} 4,${half}`} fill={color} />;
    case "star":
      const points = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 72 - 90) * (Math.PI / 180);
        const innerAngle = ((i * 72 + 36) - 90) * (Math.PI / 180);
        const outerR = half - 4;
        const innerR = outerR * 0.4;
        points.push(`${half + outerR * Math.cos(outerAngle)},${half + outerR * Math.sin(outerAngle)}`);
        points.push(`${half + innerR * Math.cos(innerAngle)},${half + innerR * Math.sin(innerAngle)}`);
      }
      return <polygon points={points.join(" ")} fill={color} />;
    default:
      return <circle cx={half} cy={half} r={half - 4} fill={color} />;
  }
};

const ShapeWorld = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const shapeId = useRef(0);
  const { trackEvent, flush } = useAnalytics("shape");

  useEffect(() => () => { flush(); }, [flush]);

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

    const id = shapeId.current++;
    const size = 60 + Math.random() * 60;
    const newShape: Shape = {
      id,
      x: x - size / 2,
      y: y - size / 2,
      type: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size,
      rotation: Math.random() * 360,
    };

    setShapes((prev) => [...prev.slice(-12), newShape]);
    playSound("pop");
    trackEvent("tap", x, y, { shape: newShape.type, color: newShape.color });
  }, []);

  const handleShapeTap = useCallback((id: number) => {
    setShapes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, size: s.size * 1.3, rotation: s.rotation + 45, color: COLORS[Math.floor(Math.random() * COLORS.length)] }
          : s
      )
    );
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden cursor-pointer"
      style={{ backgroundColor: "hsl(40, 50%, 97%)" }}
      onTouchStart={handleInteraction}
      onClick={handleInteraction}
    >
      {shapes.map((shape) => (
        <svg
          key={shape.id}
          className="absolute transition-all duration-500 ease-out"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
            transform: `rotate(${shape.rotation}deg)`,
            animation: "bounce-in 0.5s ease-out forwards",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
          }}
          viewBox={`0 0 ${shape.size} ${shape.size}`}
          onClick={(e) => {
            e.stopPropagation();
            handleShapeTap(shape.id);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleShapeTap(shape.id);
          }}
        >
          <ShapeSVG type={shape.type} color={shape.color} size={shape.size} />
        </svg>
      ))}

      {shapes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-2xl animate-gentle-pulse opacity-20 bg-lavender" />
        </div>
      )}
    </div>
  );
};

export default ShapeWorld;
