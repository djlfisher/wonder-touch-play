import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Palette, Shapes, Grid3X3, Wind, Music, Hash, Type, Volume2, Timer, BarChart3 } from "lucide-react";
import { usePlayStats } from "@/hooks/usePlayStats";

interface Settings {
  worlds: { color: boolean; shape: boolean; pattern: boolean; motion: boolean; music: boolean; number: boolean; alphabet: boolean };
  sessionMinutes: number;
  calmMode: boolean;
  soundEnabled: boolean;
  timerEnabled: boolean;
}

interface ParentDashboardProps {
  onBack: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

const WORLD_COLORS: Record<string, string> = {
  color: "bg-coral",
  shape: "bg-lavender",
  pattern: "bg-sunny",
  motion: "bg-sky",
  music: "bg-peach",
  number: "bg-mint",
  alphabet: "bg-sunny",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ParentDashboard = ({ onBack, settings, onSettingsChange }: ParentDashboardProps) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const stats = usePlayStats();

  const update = (partial: Partial<Settings>) => {
    const updated = { ...localSettings, ...partial };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const updateWorld = (key: keyof typeof localSettings.worlds) => {
    update({ worlds: { ...localSettings.worlds, [key]: !localSettings.worlds[key] } });
  };

  const worlds = [
    { key: "color" as const, label: "Color World", icon: Palette, color: "bg-coral" },
    { key: "shape" as const, label: "Shape World", icon: Shapes, color: "bg-lavender" },
    { key: "pattern" as const, label: "Pattern World", icon: Grid3X3, color: "bg-sunny" },
    { key: "motion" as const, label: "Motion World", icon: Wind, color: "bg-sky" },
    { key: "music" as const, label: "Music World", icon: Music, color: "bg-peach" },
    { key: "number" as const, label: "Number World", icon: Hash, color: "bg-mint" },
    { key: "alphabet" as const, label: "Alphabet World", icon: Type, color: "bg-sunny" },
  ];

  const maxTaps = Math.max(...stats.worldStats.map((s) => s.count), 1);

  return (
    <div className="fixed inset-0 bg-background overflow-auto"
         style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="max-w-lg mx-auto p-6 pb-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground mb-6"
          style={{ minHeight: "48px" }}
          aria-label="Back to explorer"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-nunito font-semibold">Back to Explorer</span>
        </button>

        <h1 className="text-2xl font-nunito font-bold text-foreground mb-1">Parent Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-8">Customize your little explorer's experience</p>

        {/* Play Stats */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            <BarChart3 className="inline mr-2" size={14} />Play History
          </h2>
          <div className="p-4 bg-card rounded-2xl shadow-sm border border-border space-y-4">
            {stats.loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-nunito">Today's taps</span>
                  <span className="font-nunito font-bold text-foreground">{stats.todayTaps}</span>
                </div>
                {stats.favoriteWorld && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-nunito">Favorite world</span>
                    <span className="font-nunito font-bold text-foreground capitalize">{stats.favoriteWorld}</span>
                  </div>
                )}
                {/* Bar chart */}
                {stats.worldStats.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {stats.worldStats.map((ws) => (
                      <div key={ws.world} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16 capitalize font-nunito">{ws.world}</span>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${WORLD_COLORS[ws.world] || "bg-primary"}`}
                            style={{ width: `${(ws.count / maxTaps) * 100}%`, transition: "width 0.5s" }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right font-nunito">{ws.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Week activity dots */}
                <div className="flex justify-between pt-2">
                  {stats.weekActivity.map((active, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${active ? "bg-accent" : "bg-muted"}`} />
                      <span className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* World toggles */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Discovery Worlds
          </h2>
          <div className="space-y-3">
            {worlds.map((world) => (
              <div
                key={world.key}
                className="flex items-center justify-between p-4 bg-card rounded-2xl shadow-sm border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${world.color} rounded-xl flex items-center justify-center`}>
                    <world.icon size={20} className="text-primary-foreground" />
                  </div>
                  <span className="font-nunito font-semibold text-foreground">{world.label}</span>
                </div>
                <Switch checked={localSettings.worlds[world.key]} onCheckedChange={() => updateWorld(world.key)} />
              </div>
            ))}
          </div>
        </section>

        {/* Session timer */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Session Timer</h2>
          <div className="p-4 bg-card rounded-2xl shadow-sm border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mint rounded-xl flex items-center justify-center">
                  <Timer size={20} className="text-primary-foreground" />
                </div>
                <div>
                  <span className="font-nunito font-semibold text-foreground block">Enable Timer</span>
                  <span className="text-xs text-muted-foreground">Gently ends session after set time</span>
                </div>
              </div>
              <Switch checked={localSettings.timerEnabled} onCheckedChange={(v) => update({ timerEnabled: v })} />
            </div>
            {localSettings.timerEnabled && (
              <div>
                <div className="flex justify-between mb-3">
                  <span className="font-nunito text-foreground text-sm">Duration</span>
                  <span className="font-nunito font-bold text-primary">{localSettings.sessionMinutes} min</span>
                </div>
                <Slider value={[localSettings.sessionMinutes]} onValueChange={(v) => update({ sessionMinutes: v[0] })} min={5} max={30} step={5} className="w-full" />
              </div>
            )}
          </div>
        </section>

        {/* Sound */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Sound Effects</h2>
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sunny rounded-xl flex items-center justify-center">
                <Volume2 size={20} className="text-primary-foreground" />
              </div>
              <div>
                <span className="font-nunito font-semibold text-foreground block">Sound</span>
                <span className="text-xs text-muted-foreground">Gentle chimes & soft pops</span>
              </div>
            </div>
            <Switch checked={localSettings.soundEnabled} onCheckedChange={(v) => update({ soundEnabled: v })} />
          </div>
        </section>

        {/* Calm mode */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Experience Mode</h2>
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl shadow-sm border border-border">
            <div>
              <span className="font-nunito font-semibold text-foreground block">Calm Mode</span>
              <span className="text-xs text-muted-foreground">Slower animations, softer colors, quieter sounds</span>
            </div>
            <Switch checked={localSettings.calmMode} onCheckedChange={(v) => update({ calmMode: v })} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ParentDashboard;
