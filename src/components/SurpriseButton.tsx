import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  world: string;
  /** Function that returns a prompt string when the surprise is requested */
  buildPrompt: () => string;
  /** Optional positioning override */
  className?: string;
}

const SurpriseButton = ({ world, buildPrompt, className }: Props) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true); setUrl(null); setOpen(true);
    const prompt = buildPrompt();
    const { data, error } = await supabase.functions.invoke("ai-generate-image", { body: { world, prompt } });
    setLoading(false);
    if (error || !data?.url) {
      toast({ title: "Couldn't generate image", description: "Try again in a moment." });
      setOpen(false);
      return;
    }
    setUrl(data.url);
  };

  return (
    <>
      <button
        onClick={generate}
        className={`fixed z-40 w-12 h-12 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform ${className ?? "top-4 left-4"}`}
        style={{ top: "max(1rem, env(safe-area-inset-top, 1rem))" }}
        aria-label="Generate AI surprise"
      >
        <Sparkles size={18} className="text-foreground/70" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-card rounded-3xl p-4 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-card shadow flex items-center justify-center"
              aria-label="Close"
            >
              <X size={16} className="text-foreground" />
            </button>
            {loading && (
              <div className="aspect-square flex items-center justify-center">
                <Sparkles size={48} className="text-primary animate-[gentle-pulse_1.2s_ease-in-out_infinite]" />
              </div>
            )}
            {url && (
              <img src={url} alt="AI illustration" className="w-full aspect-square object-cover rounded-2xl" />
            )}
            <button
              onClick={generate}
              disabled={loading}
              className="w-full mt-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-nunito font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              style={{ minHeight: 48 }}
            >
              <Sparkles size={16} /> Another!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SurpriseButton;
