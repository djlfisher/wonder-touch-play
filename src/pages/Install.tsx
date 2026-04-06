import { ArrowLeft, Share, Plus, Download, Smartphone, Watch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 bg-background overflow-auto">
      <div className="max-w-lg mx-auto p-6 pb-12">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground mb-6 touch-target"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-nunito font-semibold">Back to Explorer</span>
        </button>

        <h1 className="text-2xl font-nunito font-extrabold text-foreground mb-2">
          Install Little Explorer
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Add to your home screen for a full-screen, app-like experience
        </p>

        {isInstalled && (
          <div className="p-4 bg-accent/20 rounded-2xl mb-8 border border-accent/30">
            <p className="font-nunito font-semibold text-accent-foreground text-center">
              ✅ Already installed! Open from your home screen.
            </p>
          </div>
        )}

        {/* Native install button (Chrome/Edge) */}
        {deferredPrompt && !isInstalled && (
          <button
            onClick={handleInstall}
            className="w-full mb-8 p-4 bg-primary text-primary-foreground rounded-2xl font-nunito font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg"
          >
            <Download size={24} />
            Install Now
          </button>
        )}

        {/* iOS Instructions */}
        {isIOS && !isInstalled && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Smartphone size={16} />
              iPhone & iPad
            </h2>
            <div className="space-y-3">
              {[
                { step: 1, icon: <Share size={20} className="text-secondary" />, text: "Tap the Share button in Safari (the square with an arrow)" },
                { step: 2, icon: <Plus size={20} className="text-secondary" />, text: "Scroll down and tap \"Add to Home Screen\"" },
                { step: 3, icon: <Download size={20} className="text-secondary" />, text: "Tap \"Add\" to confirm" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 p-4 bg-card rounded-2xl shadow-sm border border-border">
                  <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <span className="font-nunito font-bold text-foreground text-sm">Step {item.step}</span>
                    <p className="font-nunito text-muted-foreground text-sm mt-1">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Android Instructions */}
        {isAndroid && !deferredPrompt && !isInstalled && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Smartphone size={16} />
              Android
            </h2>
            <div className="space-y-3">
              {[
                { step: 1, text: "Tap the menu button (⋮) in Chrome" },
                { step: 2, text: "Tap \"Add to Home screen\"" },
                { step: 3, text: "Tap \"Add\" to confirm" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 p-4 bg-card rounded-2xl shadow-sm border border-border">
                  <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center shrink-0">
                    <span className="font-nunito font-bold text-secondary">{item.step}</span>
                  </div>
                  <div>
                    <span className="font-nunito font-bold text-foreground text-sm">Step {item.step}</span>
                    <p className="font-nunito text-muted-foreground text-sm mt-1">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Desktop fallback */}
        {!isIOS && !isAndroid && !deferredPrompt && !isInstalled && (
          <section className="mb-8">
            <div className="p-4 bg-card rounded-2xl shadow-sm border border-border">
              <p className="font-nunito text-muted-foreground text-sm">
                Open this page on your <strong>iPhone</strong> or <strong>Android</strong> phone to install to your home screen. Or use Chrome's menu → "Install app".
              </p>
            </div>
          </section>
        )}

        {/* Benefits */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Why Install?
          </h2>
          <div className="space-y-3">
            {[
              { emoji: "📱", title: "Full Screen", desc: "No browser bars — a distraction-free experience" },
              { emoji: "⚡", title: "Instant Launch", desc: "Open directly from the home screen" },
              { emoji: "📡", title: "Works Offline", desc: "Play even without an internet connection" },
              { emoji: "🔒", title: "Safe & Simple", desc: "No app store, no downloads, no tracking" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-4 bg-card rounded-2xl shadow-sm border border-border">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <span className="font-nunito font-bold text-foreground text-sm">{item.title}</span>
                  <p className="font-nunito text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Apple Watch note */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Watch size={16} />
            Apple Watch
          </h2>
          <div className="p-4 bg-card rounded-2xl shadow-sm border border-border">
            <p className="font-nunito text-muted-foreground text-sm">
              Apple Watch requires a native watchOS companion app built with SwiftUI. Visit our documentation for a step-by-step guide to building the Watch experience.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Install;
