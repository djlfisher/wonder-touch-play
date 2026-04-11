import { Palette, Shapes, Grid3X3, Wind, Music, Settings, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

type WorldType = "color" | "shape" | "pattern" | "motion" | "music";

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
];

const WorldSelector = ({ onSelect, onSettings, enabledWorlds, parentUnlocked = true }: WorldSelectorProps) => {
  const available = worlds.filter((w) => enabledWorlds[w.key]);
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6"
         style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}>
      <div className="text-center mb-10 animate-slide-up">
        <h1 className="text-3xl font-nunito font-extrabold text-foreground mb-2">
          Little Explorer
        </h1>
        <p className="text-muted-foreground font-nunito text-sm">Touch & Discover</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
        {available.map((world, i) => (
          <button
            key={world.key}
            onClick={() => onSelect(world.key)}
            className={`${world.bg} rounded-3xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform duration-150`}
            style={{
              animationDelay: `${i * 0.1}s`,
              animation: "slide-up 0.4s ease-out forwards",
              opacity: 0,
              minHeight: "120px",
              minWidth: "120px",
            }}
            aria-label={`Open ${world.label} world — ${world.description}`}
          >
            <world.icon size={36} className="text-primary-foreground" />
            <span className="font-nunito font-bold text-primary-foreground text-lg">
              {world.label}
            </span>
            <span className="font-nunito text-primary-foreground/70 text-xs">
              {world.description}
            </span>
          </button>
        ))}
      </div>

      {/* Parent controls — only visible after parent gate */}
      {parentUnlocked && (
        <div className="flex items-center gap-3 animate-fade-in">
          <button
            onClick={onSettings}
            className="flex items-center gap-2 px-5 py-3 bg-muted rounded-full text-muted-foreground active:scale-95 transition-transform"
            style={{ minHeight: "48px" }}
            aria-label="Open parent settings"
          >
            <Settings size={18} />
            <span className="font-nunito font-semibold text-sm">Parent Settings</span>
          </button>
          <button
            onClick={() => navigate("/install")}
            className="flex items-center gap-2 px-5 py-3 bg-muted rounded-full text-muted-foreground active:scale-95 transition-transform"
            style={{ minHeight: "48px" }}
            aria-label="Install app"
          >
            <Download size={18} />
            <span className="font-nunito font-semibold text-sm">Install</span>
          </button>
        </div>
      )}

      {!parentUnlocked && (
        <p className="text-muted-foreground/30 text-xs font-nunito mt-4">
          Adults: hold 3 fingers for settings
        </p>
      )}
    </div>
  );
};

export default WorldSelector;
