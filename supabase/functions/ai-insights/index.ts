import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SYSTEM_PROMPT = `You are an early-childhood-development assistant helping a parent
understand how their toddler (1-3 years) is engaging with the Little Explorer app.
Be warm, encouraging, plain-English, never clinical. Avoid diagnosing.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stats } = await req.json();
    if (!stats || typeof stats !== "object") {
      return new Response(JSON.stringify({ error: "Invalid stats" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Here are the recent play stats:\n${JSON.stringify(stats, null, 2)}\n\nGenerate insights.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_insights",
            description: "Return a parent-friendly insights report.",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "2-3 sentence warm overview." },
                strengths: { type: "array", items: { type: "string" }, description: "2-3 things the child seems to enjoy or do well." },
                suggestions: { type: "array", items: { type: "string" }, description: "2-3 gentle suggestions for next sessions." },
                favoriteWorld: { type: "string", description: "Best-engaged world name or empty." },
                recommendedWorld: { type: "string", enum: ["color","shape","pattern","motion","music","number","alphabet","colormix","animals",""], description: "Single world key the child should try next to balance their play. Empty if no recommendation." },
              },
              required: ["summary", "strengths", "suggestions", "favoriteWorld", "recommendedWorld"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_insights" } },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit, please wait." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("ai-insights gateway:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;
    if (!args) {
      return new Response(JSON.stringify({ error: "No insights returned" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
