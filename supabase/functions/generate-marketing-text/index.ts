import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const { products, format, campaignType, customInstructions } = await req.json();

    if (!products || products.length === 0) throw new Error("Nenhum produto selecionado");

    const productList = products.map((p: any) =>
      `- ${p.name} (SKU: ${p.sku || 'N/A'}, Preço: R$ ${Number(p.price).toFixed(2)}, Categoria: ${p.category || 'Geral'})`
    ).join("\n");

    const formatInstructions: Record<string, string> = {
      post_instagram: "Post para Instagram (até 2200 caracteres, visual e engajante)",
      story_instagram: "Story para Instagram (texto curto e impactante, até 100 caracteres)",
      anuncio_facebook: "Anúncio para Facebook (headline + corpo + CTA)",
      banner: "Texto para banner promocional (headline curta + subtítulo)",
      whatsapp: "Mensagem para WhatsApp (informal, direta, com emojis)",
      email: "E-mail marketing (assunto + corpo + CTA)",
    };

    const campaignInstructions: Record<string, string> = {
      promotion: "Campanha promocional com foco em desconto e urgência",
      new_products: "Lançamento de novos produtos, foco em novidade e exclusividade",
      best_sellers: "Produtos mais vendidos, foco em popularidade e confiança",
      high_stock: "Queima de estoque, foco em preço baixo e disponibilidade imediata",
      seasonal: "Campanha sazonal/temática",
    };

    const systemPrompt = `Você é um especialista em marketing digital para o setor de motores estacionários, peças e equipamentos.
A empresa é a Gründemann, referência em peças para motores estacionários a gasolina e diesel.

Público-alvo: mecânicos, oficinas, locadoras de equipamentos, assistências técnicas.

Gere conteúdo publicitário profissional e persuasivo em português brasileiro.

IMPORTANTE:
- Use linguagem técnica mas acessível
- Sempre inclua call-to-action relevante
- Sugira hashtags quando aplicável
- O tom deve ser profissional mas engajante`;

    const userPrompt = `Gere conteúdo de marketing para os seguintes produtos:

${productList}

Formato: ${formatInstructions[format] || format}
Tipo de campanha: ${campaignInstructions[campaignType] || campaignType}
${customInstructions ? `Instruções adicionais: ${customInstructions}` : ""}

Responda EXATAMENTE neste formato JSON (sem markdown, sem code blocks):
{
  "headline": "Título principal do anúncio",
  "body_text": "Texto principal do anúncio/post",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3",
  "cta": "Texto do botão/chamada para ação",
  "short_description": "Descrição curta (1 linha)"
}`;

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
          { role: "user", content: userPrompt },
        ],
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
      throw new Error("Erro na geração de texto");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Try to parse JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { body_text: content, headline: "", hashtags: "", cta: "", short_description: "" };
    } catch {
      parsed = { body_text: content, headline: "", hashtags: "", cta: "", short_description: "" };
    }

    return new Response(JSON.stringify({ success: true, ...parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-marketing-text error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
