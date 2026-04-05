import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Palette, Shapes, Grid3X3, Wind } from "lucide-react";

interface ParentDashboardProps {
  onBack: () => void;
  settings: {
    worlds: { color: boolean; shape: boolean; pattern: boolean; motion: boolean };
    sessionMinutes: number;
    calmMode: boolean;
  };
  onSettingsChange: (settings: ParentDashboardProps["settings"]) => void;
}

const ParentDashboard = ({ onBack, settings, onSettingsChange }: ParentDashboardProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const updateWorld = (key: keyof typeof localSettings.worlds) => {
    const updated = {
      ...localSettings,
      worlds: { ...localSettings.worlds, [key]: !localSettings.worlds[key] },
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const updateSession = (val: number[]) => {
    const updated = { ...localSettings, sessionMinutes: val[0] };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const toggleCalm = () => {
    const updated = { ...localSettings, calmMode: !localSettings.calmMode };
    setLocalSettings(updated);
    onSettingsChange(updated);
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

        {/* Session duration */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Session Duration
          </h2>
          <div className="p-4 bg-card rounded-2xl shadow-sm border border-border">
            <div className="flex justify-between mb-3">
              <span className="font-nunito text-foreground">Timer</span>
              <span className="font-nunito font-bold text-primary">
                {localSettings.sessionMinutes} min
              </span>
            </div>
            <Slider
              value={[localSettings.sessionMinutes]}
              onValueChange={updateSession}
              min={5}
              max={30}
              step={5}
              className="w-full"
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
            <Switch checked={localSettings.calmMode} onCheckedChange={toggleCalm} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ParentDashboard;
