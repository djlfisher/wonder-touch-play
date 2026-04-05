import { useState, useCallback } from "react";
import WorldSelector from "@/components/WorldSelector";
import ParentDashboard from "@/components/ParentDashboard";
import ColorWorld from "@/components/worlds/ColorWorld";
import ShapeWorld from "@/components/worlds/ShapeWorld";
import PatternWorld from "@/components/worlds/PatternWorld";
import MotionWorld from "@/components/worlds/MotionWorld";
import SessionTimer from "@/components/SessionTimer";
import { setSoundEnabled } from "@/lib/sounds";
import { X } from "lucide-react";

type View = "home" | "settings" | "color" | "shape" | "pattern" | "motion";

const defaultSettings = {
  worlds: { color: true, shape: true, pattern: true, motion: true },
  sessionMinutes: 15,
  calmMode: false,
  soundEnabled: true,
  timerEnabled: false,
};

const Index = () => {
  const [view, setView] = useState<View>("home");
  const [settings, setSettings] = useState(defaultSettings);

  const handleSelectWorld = useCallback((world: "color" | "shape" | "pattern" | "motion") => {
    setView(world);
  }, []);

  const handleSettingsChange = useCallback((newSettings: typeof defaultSettings) => {
    setSettings(newSettings);
    setSoundEnabled(newSettings.soundEnabled);
  }, []);

  const renderWorld = () => {
    switch (view) {
      case "color": return <ColorWorld />;
      case "shape": return <ShapeWorld />;
      case "pattern": return <PatternWorld />;
      case "motion": return <MotionWorld />;
      default: return null;
    }
  };

  if (view === "settings") {
    return (
      <ParentDashboard
        onBack={() => setView("home")}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    );
  }

  if (view !== "home") {
    return (
      <div className="relative">
        {renderWorld()}
        {/* Session timer */}
        <SessionTimer
          durationMinutes={settings.sessionMinutes}
          active={settings.timerEnabled}
          onTimeUp={() => setView("home")}
        />
        {/* Exit button */}
        <button
          onClick={() => setView("home")}
          className="fixed top-4 right-4 z-50 w-10 h-10 bg-foreground/10 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <X size={16} className="text-foreground/50" />
        </button>
      </div>
    );
  }

  return (
    <WorldSelector
      onSelect={handleSelectWorld}
      onSettings={() => setView("settings")}
      enabledWorlds={settings.worlds}
    />
  );
};

export default Index;
