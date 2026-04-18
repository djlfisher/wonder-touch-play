import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SYSTEM_PROMPT = `Generate a single bright, cheerful, simple cartoon illustration suitable for a toddler (1-3 years).
Solid soft background, bold flat colors, friendly rounded shapes. No text, no scary content.`;

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { world, prompt } = await req.json();
    if (typeof world !== "string" || typeof prompt !== "string" || prompt.length > 300) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const promptHash = await sha256Hex(`${world}::${prompt}`);

    // Cache hit?
    const { data: cached } = await admin
      .from("ai_asset_cache")
      .select("storage_path")
      .eq("world", world)
      .eq("prompt_hash", promptHash)
      .maybeSingle();
    if (cached?.storage_path) {
      const { data: pub } = admin.storage.from("ai-assets").getPublicUrl(cached.storage_path);
      return new Response(JSON.stringify({ url: pub.publicUrl, cached: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: `${SYSTEM_PROMPT}\n\nSubject: ${prompt}` }],
        modalities: ["image", "text"],
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("ai-generate-image gateway:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const dataUrl: string | undefined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl?.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "No image returned" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const [, mime, b64] = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/) ?? [];
    if (!mime || !b64) {
      return new Response(JSON.stringify({ error: "Bad image format" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const ext = mime.split("/")[1];
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${world}/${promptHash}.${ext}`;

    const { error: upErr } = await admin.storage.from("ai-assets").upload(path, bytes, { contentType: mime, upsert: true });
    if (upErr) {
      console.error("upload error:", upErr);
      return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await admin.from("ai_asset_cache").insert({ world, prompt_hash: promptHash, storage_path: path });

    const { data: pub } = admin.storage.from("ai-assets").getPublicUrl(path);
    return new Response(JSON.stringify({ url: pub.publicUrl, cached: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
