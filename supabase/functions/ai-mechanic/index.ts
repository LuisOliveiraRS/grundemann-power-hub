import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userQuestion, sessionId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract keywords for product search
    const searchTerms = userQuestion.toLowerCase()
      .replace(/[?!.,;:]/g, " ")
      .split(/\s+/)
      .filter((w: string) => w.length > 2 && !["não","meu","que","para","com","uma","motor","como","tem","por","muito","está","pode"].includes(w));

    let products: any[] = [];

    if (searchTerms.length > 0) {
      // Search with multiple terms using OR
      const orConditions = searchTerms.slice(0, 5).map((term: string) =>
        `name.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%,brand.ilike.%${term}%,engine_model.ilike.%${term}%,hp.ilike.%${term}%`
      ).join(",");

      const { data } = await supabase
        .from("products")
        .select("id, name, price, image_url, sku, description, brand, hp, engine_model")
        .eq("is_active", true)
        .or(orConditions)
        .limit(6);

      products = data || [];
    }

    // Fallback broader search
    if (products.length === 0 && searchTerms.length > 0) {
      for (const term of searchTerms.slice(0, 3)) {
        const { data } = await supabase
          .from("products")
          .select("id, name, price, image_url, sku, description, brand, hp, engine_model")
          .eq("is_active", true)
          .or(`name.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%`)
          .limit(5);
        if (data && data.length > 0) { products = data; break; }
      }
    }

    // Detect problem keywords for better diagnostics
    const problemKeywords = {
      "não liga": "falha na partida",
      "não pega": "falha na partida", 
      "falhando": "falha intermitente",
      "fumaçando": "excesso de fumaça",
      "vazando": "vazamento",
      "sem força": "perda de potência",
      "engasgando": "alimentação irregular",
      "esquentando": "superaquecimento",
      "barulho": "ruído anormal",
      "vibração": "vibração excessiva",
      "perde potência": "perda de potência",
      "consumo alto": "consumo excessivo",
    };

    const detectedProblems: string[] = [];
    const questionLower = userQuestion.toLowerCase();
    for (const [keyword, problem] of Object.entries(problemKeywords)) {
      if (questionLower.includes(keyword)) detectedProblems.push(problem);
    }

    const productContext = products.length > 0
      ? `\n\nProdutos encontrados no catálogo Grundemann:\n${products.map(p =>
          `- **${p.name}** (SKU: ${p.sku || 'N/A'}, Preço: R$${Number(p.price).toFixed(2)}, Marca: ${p.brand || 'N/A'}, HP: ${p.hp || 'N/A'}, Motor: ${p.engine_model || 'N/A'})`
        ).join("\n")}`
      : "";

    const systemPrompt = `Você é o **Mecânico Virtual Grundemann**, um assistente técnico especializado em diagnóstico de motores estacionários a gasolina e diesel.

Sua MISSÃO é ajudar mecânicos, oficinas, locadoras e clientes a:
1. Diagnosticar problemas em motores estacionários
2. Identificar possíveis causas de falha
3. Recomendar peças compatíveis do catálogo Grundemann
4. Orientar sobre manutenção preventiva
5. Direcionar para produtos ou orçamento

FLUXO DE DIAGNÓSTICO - Quando o usuário relatar um problema:
1. Identifique o tipo de problema
2. Se necessário, pergunte: marca do motor, modelo, potência (HP), tipo de combustível, sintomas
3. Analise possíveis causas (liste numeradas)
4. Apresente diagnóstico provável
5. Sugira peças ou manutenção específica

BASE DE CONHECIMENTO - Motores estacionários:
- Potências comuns: 5hp, 5.5hp, 6.5hp, 7hp, 8hp, 9hp, 10hp, 13hp, 14hp, 15hp
- Marcas: Honda, Branco, Toyama, Buffalo, Motomil, Kohler, Briggs & Stratton
- Tipos: Gasolina (4 tempos) e Diesel
- Aplicações: Geradores, bombas d'água, compactadores, cortadores, roçadeiras

PROBLEMAS COMUNS E DIAGNÓSTICOS:
• Não liga/não pega: vela de ignição, carburador entupido, filtro ar sujo, combustível velho, bobina
• Falhando/engasgando: carburador desregulado, vela gasta, filtro combustível, junta cabeçote
• Fumaçando: anéis de pistão gastos, óleo em excesso, válvulas desreguladas, filtro ar
• Sem força/perde potência: filtro ar entupido, carburador, escapamento obstruído, compressão baixa
• Vazando óleo: retentor, junta do cárter, nível de óleo, vedações
• Esquentando: óleo insuficiente, aletas sujas, ventoinha, carga excessiva
• Vibração: suporte motor solto, volante desbalanceado, mancais gastos

PEÇAS MAIS SUBSTITUÍDAS: vela de ignição, filtro de ar, filtro de óleo, carburador, bobina de ignição, cabo de vela, junta de cabeçote, retentor, anel de pistão, válvula de combustível

REGRAS DE RESPOSTA:
- Responda SEMPRE em português brasileiro
- Seja técnico, claro e direto
- Liste causas numeradas (1, 2, 3...)
- Quando sugerir peças, SEMPRE mencione produtos do catálogo quando disponíveis
- Para problemas sérios, recomende consultar um mecânico profissional
- Máximo 400 palavras por resposta
- Use emojis moderadamente (🔧 ⚙️ 🛠️ ⚡ 🔥 💧)
- NUNCA dê respostas genéricas - seja específico sobre motores estacionários
- Quando não souber a marca/modelo, PERGUNTE antes de diagnosticar
${productContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-8),
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("AI gateway error:", response.status, errorBody);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas perguntas em pouco tempo. Aguarde um momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Acesse Settings → Workspace → Usage no Lovable para recarregar.", details: errorBody }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status} - ${errorBody}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua pergunta.";

    // Log the conversation
    try {
      await supabase.from("ai_conversation_logs").insert({
        user_question: userQuestion,
        ai_response: aiResponse.substring(0, 2000),
        problem_identified: detectedProblems.join(", ") || null,
        products_suggested: products.map(p => ({ id: p.id, name: p.name, sku: p.sku })),
        session_id: sessionId || null,
      });
    } catch (logErr) {
      console.error("Failed to log conversation:", logErr);
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      products: products.map(p => ({
        id: p.id, name: p.name, price: p.price, image_url: p.image_url, sku: p.sku,
      })),
      detectedProblems,
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
