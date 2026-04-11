import { useState, useCallback, useEffect, useMemo } from "react";
import WorldSelector from "@/components/WorldSelector";
import ParentDashboard from "@/components/ParentDashboard";
import ColorWorld from "@/components/worlds/ColorWorld";
import ShapeWorld from "@/components/worlds/ShapeWorld";
import PatternWorld from "@/components/worlds/PatternWorld";
import MotionWorld from "@/components/worlds/MotionWorld";
import MusicWorld from "@/components/worlds/MusicWorld";
import NumberWorld from "@/components/worlds/NumberWorld";
import SessionTimer from "@/components/SessionTimer";
import Onboarding from "@/components/Onboarding";
import { setSoundEnabled, setVolumeMultiplier } from "@/lib/sounds";
import { useParentGate } from "@/hooks/useParentGate";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { X } from "lucide-react";

type WorldKey = "color" | "shape" | "pattern" | "motion" | "music" | "number";
type View = "home" | "settings" | WorldKey;

const STORAGE_KEY = "le_settings";

const defaultSettings = {
  worlds: { color: true, shape: true, pattern: true, motion: true, music: true, number: true },
  sessionMinutes: 15,
  calmMode: false,
  soundEnabled: true,
  timerEnabled: false,
};

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return { ...defaultSettings, ...saved, worlds: { ...defaultSettings.worlds, ...saved.worlds } };
    }
  } catch {}
  return defaultSettings;
};

const Index = () => {
  const [view, setView] = useState<View>("home");
  const [settings, setSettings] = useState(loadSettings);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("le_onboarded"));
  const { unlocked } = useParentGate();

  const enabledWorldKeys = useMemo(() => {
    const keys: WorldKey[] = ["color", "shape", "pattern", "motion", "music", "number"];
    return keys.filter((k) => settings.worlds[k]);
  }, [settings.worlds]);

  const currentWorldIdx = enabledWorldKeys.indexOf(view as WorldKey);

  const swipeLeft = useCallback(() => {
    if (currentWorldIdx >= 0 && currentWorldIdx < enabledWorldKeys.length - 1) {
      setView(enabledWorldKeys[currentWorldIdx + 1]);
    }
  }, [currentWorldIdx, enabledWorldKeys]);

  const swipeRight = useCallback(() => {
    if (currentWorldIdx > 0) {
      setView(enabledWorldKeys[currentWorldIdx - 1]);
    }
  }, [currentWorldIdx, enabledWorldKeys]);

  const swipeHandlers = useSwipeGesture(swipeLeft, swipeRight);

  useEffect(() => {
    setSoundEnabled(settings.soundEnabled);
    setVolumeMultiplier(settings.calmMode ? 0.5 : 1);
  }, [settings.soundEnabled, settings.calmMode]);

  const handleSelectWorld = useCallback((world: WorldKey) => setView(world), []);

  const handleSettingsChange = useCallback((newSettings: typeof defaultSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  const renderWorld = () => {
    const calm = settings.calmMode;
    switch (view) {
      case "color": return <ColorWorld calmMode={calm} />;
      case "shape": return <ShapeWorld calmMode={calm} />;
      case "pattern": return <PatternWorld calmMode={calm} />;
      case "motion": return <MotionWorld calmMode={calm} />;
      case "music": return <MusicWorld calmMode={calm} />;
      case "number": return <NumberWorld calmMode={calm} />;
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
      <div
        className="relative"
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        {renderWorld()}
        <SessionTimer
          durationMinutes={settings.sessionMinutes}
          active={settings.timerEnabled}
          onTimeUp={() => setView("home")}
        />
        {/* Dot indicator */}
        {enabledWorldKeys.length > 1 && (
          <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center gap-2 pointer-events-none"
               style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            {enabledWorldKeys.map((k) => (
              <div
                key={k}
                className={`h-2 rounded-full transition-all ${
                  k === view ? "w-6 bg-primary-foreground/80" : "w-2 bg-primary-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
        {/* Exit button — only visible after parent gate */}
        {unlocked && (
          <button
            onClick={() => setView("home")}
            className="fixed top-4 right-4 z-50 w-12 h-12 bg-foreground/10 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ top: "max(1rem, env(safe-area-inset-top, 1rem))" }}
            aria-label="Exit world"
          >
            <X size={18} className="text-foreground/50" />
          </button>
        )}
      </div>
    );
  }

  return (
    <WorldSelector
      onSelect={handleSelectWorld}
      onSettings={() => setView("settings")}
      enabledWorlds={settings.worlds}
      parentUnlocked={unlocked}
    />
  );
};

export default Index;
