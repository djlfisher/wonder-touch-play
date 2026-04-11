import { useState } from "react";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  { emoji: "🌈", title: "Welcome to Little Explorer", subtitle: "A world of color, shape & sound" },
  { emoji: "👆", title: "Tap anywhere to discover", subtitle: "Every touch creates something beautiful" },
  { emoji: "🤚", title: "Parents: hold 3 fingers", subtitle: "Hold 3 fingers for 2 seconds to access settings" },
];

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      localStorage.setItem("le_onboarded", "1");
      onComplete();
    }
  };

  const current = steps[step];

  return (
    <div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8"
      onClick={next}
      onTouchStart={next}
    >
      <div className="text-center animate-fade-in" key={step}>
        <div className="text-7xl mb-6">{current.emoji}</div>
        <h1 className="text-2xl font-nunito font-extrabold text-foreground mb-3">
          {current.title}
        </h1>
        <p className="text-muted-foreground font-nunito text-base mb-8">
          {current.subtitle}
        </p>
        <div className="flex gap-2 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? "bg-primary w-6" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
        <p className="text-muted-foreground/50 text-xs mt-6 font-nunito">Tap to continue</p>
      </div>
    </div>
  );
};

export default Onboarding;
