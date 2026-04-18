import { Palette, Shapes, Grid3X3, Wind, Music, Hash, Type, Blend, Cat, Star, Settings, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStars, type WorldProgress } from "@/hooks/useProgress";

type WorldType = "color" | "shape" | "pattern" | "motion" | "music" | "number" | "alphabet" | "colormix" | "animals";

interface WorldSelectorProps {
  onSelect: (world: WorldType) => void;
  onSettings: () => void;
  enabledWorlds: Record<WorldType, boolean>;
  parentUnlocked?: boolean;
  progress?: WorldProgress;
  recommendedWorld?: WorldType | null;
}

const worlds = [
  { key: "color" as WorldType, label: "Colors", icon: Palette, color: "hsl(350, 70%, 65%)", description: "Tap & bloom" },
  { key: "shape" as WorldType, label: "Shapes", icon: Shapes, color: "hsl(270, 60%, 75%)", description: "Tap & create" },
  { key: "pattern" as WorldType, label: "Patterns", icon: Grid3X3, color: "hsl(45, 90%, 65%)", description: "Touch & flow" },
  { key: "motion" as WorldType, label: "Motion", icon: Wind, color: "hsl(200, 70%, 72%)", description: "Touch & play" },
  { key: "music" as WorldType, label: "Music", icon: Music, color: "hsl(20, 80%, 75%)", description: "Tap & play" },
  { key: "number" as WorldType, label: "Numbers", icon: Hash, color: "hsl(160, 50%, 65%)", description: "Tap & count" },
  { key: "alphabet" as WorldType, label: "Letters", icon: Type, color: "hsl(45, 90%, 65%)", description: "Tap & learn" },
  { key: "colormix" as WorldType, label: "Mixing", icon: Blend, color: "hsl(270, 60%, 75%)", description: "Drag & mix" },
  { key: "animals" as WorldType, label: "Animals", icon: Cat, color: "hsl(350, 70%, 65%)", description: "Tap & hear" },
];

const StarBadges = ({ count }: { count: number }) => {
  if (count === 0) return null;
  return (
    <div className="flex gap-0.5 justify-center">
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} size={10} className="fill-white text-white" />
      ))}
    </div>
  );
};

const WorldSelector = ({ onSelect, onSettings, enabledWorlds, parentUnlocked = true, progress, recommendedWorld }: WorldSelectorProps) => {
  const available = worlds.filter((w) => enabledWorlds[w.key]);
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 overflow-auto"
      style={{
        backgroundColor: "hsl(240, 20%, 12%)",
        paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
      }}
    >
      <div className="min-h-full flex flex-col items-center px-4 py-4">
        <div className="text-center mb-5 shrink-0">
          <h1 className="text-2xl font-nunito font-extrabold text-white mb-1">
            Little Explorer
          </h1>
          <p className="text-white/50 font-nunito text-xs">Touch & Discover</p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-5 shrink-0">
          {available.map((world) => {
            const stars = progress ? getStars(world.key, progress[world.key]) : 0;
            const isRecommended = recommendedWorld === world.key;
            return (
              <button
                key={world.key}
                onClick={() => onSelect(world.key)}
                className={`rounded-2xl p-3 flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-transform duration-150 relative ${
                  isRecommended ? "ring-2 ring-white/70 animate-[gentle-pulse_2s_ease-in-out_infinite]" : ""
                }`}
                style={{
                  backgroundColor: world.color,
                  aspectRatio: "1 / 1",
                  minHeight: "100px",
                }}
                aria-label={`Open ${world.label} world — ${world.description}${stars > 0 ? ` — ${stars} stars` : ""}${isRecommended ? " — recommended" : ""}`}
              >
                {isRecommended && (
                  <span className="absolute -top-1 -right-1 bg-white text-foreground text-[9px] font-nunito font-bold px-1.5 py-0.5 rounded-full shadow">
                    Try!
                  </span>
                )}
                <world.icon size={26} className="text-white" />
                <span className="font-nunito font-bold text-white text-sm leading-tight">
                  {world.label}
                </span>
                <span className="font-nunito text-white/60 text-[10px] leading-tight">
                  {world.description}
                </span>
                <StarBadges count={stars} />
              </button>
            );
          })}
        </div>

        {parentUnlocked && (
          <div className="flex items-center gap-2 shrink-0 mt-auto pb-2">
            <button
              onClick={onSettings}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full active:scale-95 transition-transform"
              style={{ minHeight: "44px", backgroundColor: "hsl(240, 15%, 20%)", color: "hsl(240, 10%, 60%)" }}
              aria-label="Open parent settings"
            >
              <Settings size={16} />
              <span className="font-nunito font-semibold text-xs">Settings</span>
            </button>
            <button
              onClick={() => navigate("/install")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full active:scale-95 transition-transform"
              style={{ minHeight: "44px", backgroundColor: "hsl(240, 15%, 20%)", color: "hsl(240, 10%, 60%)" }}
              aria-label="Install app"
            >
              <Download size={16} />
              <span className="font-nunito font-semibold text-xs">Install</span>
            </button>
          </div>
        )}

        {!parentUnlocked && (
          <p className="text-white/20 text-xs font-nunito mt-auto pb-2">
            Adults: hold 3 fingers for settings
          </p>
        )}
      </div>
    </div>
  );
};

export default WorldSelector;
