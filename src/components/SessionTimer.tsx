import { useState, useEffect, useCallback } from "react";

interface SessionTimerProps {
  durationMinutes: number;
  active: boolean;
  onTimeUp: () => void;
}

const SessionTimer = ({ durationMinutes, active, onTimeUp }: SessionTimerProps) => {
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    setRemaining(durationMinutes * 60);
    setShowOverlay(false);
  }, [durationMinutes, active]);

  useEffect(() => {
    if (!active || durationMinutes <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowOverlay(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, durationMinutes]);

  const handleDismiss = useCallback(() => {
    setShowOverlay(false);
    onTimeUp();
  }, [onTimeUp]);

  // Show gentle warning in last 30 seconds
  const isWarning = active && remaining > 0 && remaining <= 30;

  if (!active) return null;

  return (
    <>
      {/* Fade warning border in last 30s */}
      {isWarning && (
        <div
          className="fixed inset-0 z-40 pointer-events-none transition-opacity duration-[3000ms]"
          style={{
            boxShadow: `inset 0 0 ${80 - remaining * 2}px rgba(0,0,0,${0.1 + (30 - remaining) * 0.008})`,
          }}
        />
      )}

      {/* Time's up overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" />
          <div className="relative bg-card rounded-3xl p-8 mx-6 shadow-2xl text-center max-w-sm">
            <div className="text-5xl mb-4">🌙</div>
            <h2 className="text-xl font-nunito font-bold text-foreground mb-2">
              Time for a break!
            </h2>
            <p className="text-muted-foreground text-sm mb-6 font-nunito">
              Your little explorer has been playing for {durationMinutes} minutes.
              Time to rest those curious eyes!
            </p>
            <button
              onClick={handleDismiss}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-nunito font-bold text-base active:scale-95 transition-transform"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionTimer;
