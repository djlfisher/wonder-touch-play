import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import WorldSelector from "@/components/WorldSelector";
import ParentDashboard from "@/components/ParentDashboard";
import ColorWorld from "@/components/worlds/ColorWorld";
import ShapeWorld from "@/components/worlds/ShapeWorld";
import PatternWorld from "@/components/worlds/PatternWorld";
import MotionWorld from "@/components/worlds/MotionWorld";
import MusicWorld from "@/components/worlds/MusicWorld";
import NumberWorld from "@/components/worlds/NumberWorld";
import AlphabetWorld from "@/components/worlds/AlphabetWorld";
import ColorMixWorld from "@/components/worlds/ColorMixWorld";
import AnimalWorld from "@/components/worlds/AnimalWorld";
import SessionTimer from "@/components/SessionTimer";
import Onboarding from "@/components/Onboarding";
import { setSoundEnabled, setVolumeMultiplier } from "@/lib/sounds";
import { useParentGate } from "@/hooks/useParentGate";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useProgress } from "@/hooks/useProgress";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type WorldKey = "color" | "shape" | "pattern" | "motion" | "music" | "number" | "alphabet" | "colormix" | "animals";
type View = "home" | "settings" | WorldKey;

const STORAGE_KEY = "le_settings";

const defaultSettings = {
  worlds: { color: true, shape: true, pattern: true, motion: true, music: true, number: true, alphabet: true, colormix: true, animals: true },
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
  const [transitioning, setTransitioning] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(() => !localStorage.getItem("le_swipe_hint_seen"));
  const { unlocked } = useParentGate();
  const { progress, increment, setMax } = useProgress();
  const swipeHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabledWorldKeys = useMemo(() => {
    const keys: WorldKey[] = ["color", "shape", "pattern", "motion", "music", "number", "alphabet", "colormix", "animals"];
    return keys.filter((k) => settings.worlds[k]);
  }, [settings.worlds]);

  const currentWorldIdx = enabledWorldKeys.indexOf(view as WorldKey);

  const transitionTo = useCallback((nextView: View) => {
    setTransitioning(true);
    setTimeout(() => {
      setView(nextView);
      setTimeout(() => setTransitioning(false), 50);
    }, 200);
  }, []);

  const swipeLeft = useCallback(() => {
    if (currentWorldIdx >= 0 && currentWorldIdx < enabledWorldKeys.length - 1) {
      transitionTo(enabledWorldKeys[currentWorldIdx + 1]);
    }
  }, [currentWorldIdx, enabledWorldKeys, transitionTo]);

  const swipeRight = useCallback(() => {
    if (currentWorldIdx > 0) {
      transitionTo(enabledWorldKeys[currentWorldIdx - 1]);
    }
  }, [currentWorldIdx, enabledWorldKeys, transitionTo]);

  const swipeHandlers = useSwipeGesture(swipeLeft, swipeRight);

  useEffect(() => {
    setSoundEnabled(settings.soundEnabled);
    setVolumeMultiplier(settings.calmMode ? 0.5 : 1);
  }, [settings.soundEnabled, settings.calmMode]);

  const handleSelectWorld = useCallback((world: WorldKey) => {
    transitionTo(world);
    // Show swipe hint on first world visit, then dismiss after 3s
    if (showSwipeHint && enabledWorldKeys.length > 1) {
      swipeHintTimer.current = setTimeout(() => {
        setShowSwipeHint(false);
        localStorage.setItem("le_swipe_hint_seen", "1");
      }, 3500);
    }
  }, [transitionTo, showSwipeHint, enabledWorldKeys]);

  const handleSettingsChange = useCallback((newSettings: typeof defaultSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  // Progress callbacks
  const onColorProgress = useCallback(() => increment("color"), [increment]);
  const onShapeProgress = useCallback(() => increment("shape"), [increment]);
  const onPatternProgress = useCallback(() => increment("pattern"), [increment]);
  const onMotionProgress = useCallback(() => increment("motion"), [increment]);
  const onMusicProgress = useCallback(() => increment("music"), [increment]);
  const onNumberProgress = useCallback((count: number) => setMax("number", count), [setMax]);
  const onAlphabetProgress = useCallback((unique: number) => setMax("alphabet", unique), [setMax]);
  const onColormixProgress = useCallback(() => increment("colormix"), [increment]);
  const onAnimalsProgress = useCallback((unique: number) => setMax("animals", unique), [setMax]);

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  const renderWorld = () => {
    const calm = settings.calmMode;
    switch (view) {
      case "color": return <ColorWorld calmMode={calm} onProgress={onColorProgress} />;
      case "shape": return <ShapeWorld calmMode={calm} onProgress={onShapeProgress} />;
      case "pattern": return <PatternWorld calmMode={calm} onProgress={onPatternProgress} />;
      case "motion": return <MotionWorld calmMode={calm} onProgress={onMotionProgress} />;
      case "music": return <MusicWorld calmMode={calm} onProgress={onMusicProgress} />;
      case "number": return <NumberWorld calmMode={calm} onProgress={onNumberProgress} />;
      case "alphabet": return <AlphabetWorld calmMode={calm} onProgress={onAlphabetProgress} />;
      case "colormix": return <ColorMixWorld calmMode={calm} />;
      case "animals": return <AnimalWorld calmMode={calm} onProgress={onAnimalsProgress} />;
      default: return null;
    }
  };

  if (view === "settings") {
    return (
      <ParentDashboard
        onBack={() => transitionTo("home")}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    );
  }

  if (view !== "home") {
    return (
      <div
        className="fixed inset-0"
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "scale(0.97)" : "none",
          transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
        }}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        {renderWorld()}
        <SessionTimer
          durationMinutes={settings.sessionMinutes}
          active={settings.timerEnabled}
          onTimeUp={() => transitionTo("home")}
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

        {/* Swipe hint — only on first world visit */}
        {showSwipeHint && enabledWorldKeys.length > 1 && (
          <div className="fixed inset-x-0 bottom-16 z-50 flex justify-center pointer-events-none animate-fade-in"
               style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="flex items-center gap-2 px-4 py-2 bg-foreground/20 backdrop-blur-sm rounded-full">
              <ChevronLeft size={14} className="text-primary-foreground/70 animate-[gentle-pulse_1.5s_ease-in-out_infinite]" />
              <span className="text-primary-foreground/70 font-nunito text-xs">Swipe to explore more</span>
              <ChevronRight size={14} className="text-primary-foreground/70 animate-[gentle-pulse_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* Exit button */}
        {unlocked && (
          <button
            onClick={() => transitionTo("home")}
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
      onSettings={() => transitionTo("settings")}
      enabledWorlds={settings.worlds}
      parentUnlocked={unlocked}
      progress={progress}
    />
  );
};

export default Index;
