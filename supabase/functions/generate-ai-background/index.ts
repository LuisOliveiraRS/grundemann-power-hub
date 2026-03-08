import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const { productName, category, format } = await req.json();

    const isStory = format === "story_instagram";
    const aspectHint = isStory ? "vertical 9:16 portrait" : "square 1:1";

    const prompt = `Create a professional commercial advertising background for an industrial/mechanical parts store. 
The background should be ${aspectHint} format.
Product context: ${productName || "industrial mechanical parts"}, category: ${category || "motors and generators"}.

Requirements:
- Dark industrial/workshop atmosphere with warm amber/golden tones
- Dramatic lighting with bokeh effects and light rays
- Subtle metallic textures, gears, or workshop elements in the background (blurred)
- Rich depth with gradients from dark edges to slightly lighter center
- Professional commercial photography style
- The center area should be relatively clean/simple to allow product overlay
- Color palette: deep blacks, dark browns, warm ambers, subtle gold highlights
- NO text, NO logos, NO products - ONLY atmospheric background
- On a clean background suitable for product overlay`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro na geração de fundo IA");
    }

    const aiData = await response.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      throw new Error("Nenhuma imagem foi gerada pela IA");
    }

    return new Response(JSON.stringify({ success: true, image_url: imageData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ai-background error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
