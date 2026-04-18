import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { useAIInsights, type Insights } from "@/hooks/useAIInsights";

interface Props {
  stats: unknown;
  onInsights?: (i: Insights) => void;
}

const InsightsCard = ({ stats, onInsights }: Props) => {
  const { insights, loading, fetchInsights } = useAIInsights(onInsights);
  const [hasRequested, setHasRequested] = useState(!!insights);

  const handleGenerate = () => {
    setHasRequested(true);
    fetchInsights(stats);
  };

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        <Sparkles className="inline mr-2" size={14} />AI Insights
      </h2>
      <div className="p-4 bg-card rounded-2xl shadow-sm border border-border space-y-3">
        {!hasRequested && (
          <button
            onClick={handleGenerate}
            className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-nunito font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ minHeight: 48 }}
          >
            <Sparkles size={16} /> Generate insights
          </button>
        )}

        {loading && <p className="text-sm text-muted-foreground font-nunito">Thinking…</p>}

        {insights && !loading && (
          <>
            <p className="text-sm text-foreground font-nunito leading-relaxed">{insights.summary}</p>

            {insights.favoriteWorld && (
              <div className="text-xs text-muted-foreground font-nunito">
                <span className="font-semibold text-foreground">Favorite:</span>{" "}
                <span className="capitalize">{insights.favoriteWorld}</span>
              </div>
            )}

            {insights.strengths?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Strengths</p>
                <ul className="space-y-1">
                  {insights.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-foreground font-nunito flex gap-2">
                      <span className="text-mint">●</span><span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.suggestions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Try next</p>
                <ul className="space-y-1">
                  {insights.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-foreground font-nunito flex gap-2">
                      <span className="text-coral">●</span><span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="text-xs text-muted-foreground font-nunito flex items-center gap-1 hover:text-foreground"
              style={{ minHeight: 32 }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default InsightsCard;
