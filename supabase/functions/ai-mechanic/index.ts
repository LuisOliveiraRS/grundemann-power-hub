import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userQuestion } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search for related products based on user question
    const searchTerms = userQuestion.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    let products: any[] = [];

    if (searchTerms.length > 0) {
      const orConditions = searchTerms.map((term: string) =>
        `name.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%,brand.ilike.%${term}%,engine_model.ilike.%${term}%,hp.ilike.%${term}%`
      ).join(",");

      const { data } = await supabase
        .from("products")
        .select("id, name, price, image_url, sku, description, brand, hp, engine_model")
        .eq("is_active", true)
        .or(orConditions)
        .limit(5);

      products = data || [];
    }

    // If no products found with OR, try broader search
    if (products.length === 0 && searchTerms.length > 0) {
      const mainTerm = searchTerms[0];
      const { data } = await supabase
        .from("products")
        .select("id, name, price, image_url, sku, description, brand, hp, engine_model")
        .eq("is_active", true)
        .or(`name.ilike.%${mainTerm}%,description.ilike.%${mainTerm}%,brand.ilike.%${mainTerm}%`)
        .limit(5);
      products = data || [];
    }

    const productContext = products.length > 0
      ? `\n\nProdutos encontrados no catálogo que podem ser relevantes:\n${products.map(p =>
          `- ${p.name} (SKU: ${p.sku || 'N/A'}, Preço: R$${Number(p.price).toFixed(2)}, Marca: ${p.brand || 'N/A'}, HP: ${p.hp || 'N/A'}, Motor: ${p.engine_model || 'N/A'})`
        ).join("\n")}`
      : "\n\nNenhum produto específico encontrado no catálogo para esta consulta.";

    const systemPrompt = `Você é o "Mecânico Grundemann IA", um assistente virtual especializado em motores estacionários, geradores, bombas d'água e equipamentos a motor.

Sua função é:
1. Diagnosticar problemas comuns em motores estacionários (Honda, Branco, Toyama, etc.)
2. Sugerir possíveis causas e soluções para problemas relatados
3. Recomendar peças, filtros e acessórios adequados
4. Orientar sobre manutenção preventiva
5. Responder dúvidas técnicas sobre motores a gasolina e diesel

Regras:
- Responda SEMPRE em português brasileiro
- Seja direto e prático nas respostas
- Use formatação simples (sem markdown complexo, use apenas negrito com **)
- Quando sugerir peças, mencione os produtos do catálogo quando disponíveis
- Para problemas sérios, recomende consultar um mecânico profissional
- Mantenha respostas concisas (máximo 300 palavras)
- Use emojis moderadamente para tornar a conversa amigável
${productContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10), // Keep last 10 messages for context
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas perguntas em pouco tempo. Aguarde um momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua pergunta.";

    return new Response(JSON.stringify({
      response: aiResponse,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image_url,
        sku: p.sku,
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-mechanic error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
      response: "Desculpe, ocorreu um erro. Tente novamente.",
      products: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
