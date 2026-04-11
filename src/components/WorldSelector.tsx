import { Palette, Shapes, Grid3X3, Wind, Music, Hash, Type, Blend, Cat, Settings, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

type WorldType = "color" | "shape" | "pattern" | "motion" | "music" | "number" | "alphabet" | "colormix" | "animals";

interface WorldSelectorProps {
  onSelect: (world: WorldType) => void;
  onSettings: () => void;
  enabledWorlds: Record<WorldType, boolean>;
  parentUnlocked?: boolean;
}

const worlds = [
  { key: "color" as WorldType, label: "Colors", icon: Palette, bg: "bg-coral", description: "Tap & bloom" },
  { key: "shape" as WorldType, label: "Shapes", icon: Shapes, bg: "bg-lavender", description: "Tap & create" },
  { key: "pattern" as WorldType, label: "Patterns", icon: Grid3X3, bg: "bg-sunny", description: "Touch & flow" },
  { key: "motion" as WorldType, label: "Motion", icon: Wind, bg: "bg-sky", description: "Touch & play" },
  { key: "music" as WorldType, label: "Music", icon: Music, bg: "bg-peach", description: "Tap & play" },
  { key: "number" as WorldType, label: "Numbers", icon: Hash, bg: "bg-mint", description: "Tap & count" },
  { key: "alphabet" as WorldType, label: "Letters", icon: Type, bg: "bg-sunny", description: "Tap & learn" },
  { key: "colormix" as WorldType, label: "Mixing", icon: Blend, bg: "bg-lavender", description: "Drag & mix" },
  { key: "animals" as WorldType, label: "Animals", icon: Cat, bg: "bg-coral", description: "Tap & hear" },
];

const WorldSelector = ({ onSelect, onSettings, enabledWorlds, parentUnlocked = true }: WorldSelectorProps) => {
  const available = worlds.filter((w) => enabledWorlds[w.key]);
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 bg-background overflow-auto"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
      }}
    >
      <div className="min-h-full flex flex-col items-center px-4 py-4">
        {/* Header — compact */}
        <div className="text-center mb-5 animate-slide-up shrink-0">
          <h1 className="text-2xl font-nunito font-extrabold text-foreground mb-1">
            Little Explorer
          </h1>
          <p className="text-muted-foreground font-nunito text-xs">Touch & Discover</p>
        </div>

        {/* World grid — 3 columns, compact cards */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-5 shrink-0">
          {available.map((world, i) => (
            <button
              key={world.key}
              onClick={() => onSelect(world.key)}
              className={`${world.bg} rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-93 transition-transform duration-150`}
              style={{
                animationDelay: `${i * 0.06}s`,
                animation: "slide-up 0.35s ease-out forwards",
                opacity: 0,
                aspectRatio: "1",
              }}
              aria-label={`Open ${world.label} world — ${world.description}`}
            >
              <world.icon size={28} className="text-primary-foreground" />
              <span className="font-nunito font-bold text-primary-foreground text-sm leading-tight">
                {world.label}
              </span>
              <span className="font-nunito text-primary-foreground/60 text-[10px] leading-tight">
                {world.description}
              </span>
            </button>
          ))}
        </div>

        {/* Parent controls */}
        {parentUnlocked && (
          <div className="flex items-center gap-2 animate-fade-in shrink-0 mt-auto pb-2">
            <button
              onClick={onSettings}
              className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-full text-muted-foreground active:scale-95 transition-transform"
              style={{ minHeight: "44px" }}
              aria-label="Open parent settings"
            >
              <Settings size={16} />
              <span className="font-nunito font-semibold text-xs">Settings</span>
            </button>
            <button
              onClick={() => navigate("/install")}
              className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-full text-muted-foreground active:scale-95 transition-transform"
              style={{ minHeight: "44px" }}
              aria-label="Install app"
            >
              <Download size={16} />
              <span className="font-nunito font-semibold text-xs">Install</span>
            </button>
          </div>
        )}

        {!parentUnlocked && (
          <p className="text-muted-foreground/30 text-xs font-nunito mt-auto pb-2">
            Adults: hold 3 fingers for settings
          </p>
        )}
      </div>
    </div>
  );
};

export default WorldSelector;
