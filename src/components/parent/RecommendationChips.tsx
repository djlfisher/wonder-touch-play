import { Lightbulb } from "lucide-react";

interface Props {
  suggestions: string[];
}

const RecommendationChips = ({ suggestions }: Props) => {
  if (!suggestions?.length) return null;
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        <Lightbulb className="inline mr-2" size={14} />Recommendations
      </h2>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <span
            key={i}
            className="px-3 py-2 rounded-full bg-accent text-accent-foreground text-xs font-nunito font-semibold"
          >
            {s}
          </span>
        ))}
      </div>
    </section>
  );
};

export default RecommendationChips;
