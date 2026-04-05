import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Palette, Shapes, Grid3X3, Wind, Volume2, Timer } from "lucide-react";

interface Settings {
  worlds: { color: boolean; shape: boolean; pattern: boolean; motion: boolean };
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

const ParentDashboard = ({ onBack, settings, onSettingsChange }: ParentDashboardProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

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
  ];

  return (
    <div className="fixed inset-0 bg-background overflow-auto">
      <div className="max-w-lg mx-auto p-6 pb-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground mb-6 touch-target"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-nunito font-semibold">Back to Explorer</span>
        </button>

        <h1 className="text-2xl font-nunito font-bold text-foreground mb-1">
          Parent Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Customize your little explorer's experience
        </p>

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
                <Switch
                  checked={localSettings.worlds[world.key]}
                  onCheckedChange={() => updateWorld(world.key)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Session timer */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Session Timer
          </h2>
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
              <Switch
                checked={localSettings.timerEnabled}
                onCheckedChange={(v) => update({ timerEnabled: v })}
              />
            </div>
            {localSettings.timerEnabled && (
              <div>
                <div className="flex justify-between mb-3">
                  <span className="font-nunito text-foreground text-sm">Duration</span>
                  <span className="font-nunito font-bold text-primary">
                    {localSettings.sessionMinutes} min
                  </span>
                </div>
                <Slider
                  value={[localSettings.sessionMinutes]}
                  onValueChange={(v) => update({ sessionMinutes: v[0] })}
                  min={5}
                  max={30}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </section>

        {/* Sound */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Sound Effects
          </h2>
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
            <Switch
              checked={localSettings.soundEnabled}
              onCheckedChange={(v) => update({ soundEnabled: v })}
            />
          </div>
        </section>

        {/* Calm mode */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Experience Mode
          </h2>
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl shadow-sm border border-border">
            <div>
              <span className="font-nunito font-semibold text-foreground block">Calm Mode</span>
              <span className="text-xs text-muted-foreground">
                Slower animations, softer colors
              </span>
            </div>
            <Switch checked={localSettings.calmMode} onCheckedChange={(v) => update({ calmMode: v })} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ParentDashboard;
