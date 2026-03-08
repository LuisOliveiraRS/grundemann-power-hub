import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("No image provided");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use Supabase to search products after AI identifies the part
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em peças de motores estacionários (5HP a 15HP) a gasolina e diesel. 
Ao receber uma foto de uma peça, identifique:
1. O tipo de peça (filtro de ar, carburador, vela, pistão, etc.)
2. Possíveis marcas compatíveis (Branco, Buffalo, Toyama, Honda, etc.)
3. Potências de motor compatíveis (5hp, 7hp, 8hp, 10hp, 13hp, 15hp)
4. Termos de busca para encontrar esta peça em um catálogo

Responda APENAS em JSON válido no formato:
{
  "part_type": "nome da peça",
  "description": "descrição breve da peça identificada",
  "brands": ["marca1", "marca2"],
  "compatible_hp": ["5", "7", "13"],
  "search_terms": ["termo1", "termo2"],
  "confidence": "alta|media|baixa"
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identifique esta peça de motor estacionário:" },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const aiData = await response.json();
    const aiText = aiData.choices?.[0]?.message?.content || "";
    
    // Parse AI response
    let identification;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      identification = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      identification = null;
    }

    if (!identification) {
      return new Response(JSON.stringify({ 
        identification: null, 
        products: [],
        message: "Não foi possível identificar a peça. Tente uma foto mais nítida."
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Search products using the identified terms
    const searchTerms = identification.search_terms || [identification.part_type];
    let allProducts: any[] = [];

    for (const term of searchTerms.slice(0, 3)) {
      const searchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/products?is_active=eq.true&or=(name.ilike.%25${encodeURIComponent(term)}%25,description.ilike.%25${encodeURIComponent(term)}%25)&select=id,name,price,image_url,sku,hp,brand&limit=4`,
        { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
      );
      const prods = await searchRes.json();
      if (Array.isArray(prods)) allProducts.push(...prods);
    }

    // Deduplicate
    const seen = new Set();
    const uniqueProducts = allProducts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).slice(0, 6);

    return new Response(JSON.stringify({
      identification,
      products: uniqueProducts,
      message: `Peça identificada: ${identification.part_type}`
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("identify-part error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
