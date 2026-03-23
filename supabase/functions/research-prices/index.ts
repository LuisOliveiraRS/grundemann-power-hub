import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth: require valid JWT + admin role ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = claimsData.claims.sub as string;

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { productId, productName, productSku, ourPrice } = await req.json();

    if (!productName || ourPrice == null) {
      return new Response(
        JSON.stringify({ success: false, error: "productName and ourPrice are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl não está configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY não está configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build search query
    const searchTerms = productSku
      ? `"${productSku}" OR "${productName}" preço peça motor estacionário`
      : `"${productName}" preço peça motor estacionário`;

    console.log("Searching Firecrawl for:", searchTerms);

    // Step 1: Search with Firecrawl
    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchTerms,
        limit: 10,
        lang: "pt-BR",
        country: "BR",
        scrapeOptions: {
          formats: ["markdown"],
        },
      }),
    });

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error("Firecrawl error:", searchResponse.status, errText);

      if (searchResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Créditos Firecrawl insuficientes. Atualize seu plano." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: `Firecrawl error: ${searchResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchData = await searchResponse.json();
    const results = searchData.data || [];

    console.log(`Found ${results.length} results from Firecrawl`);

    // Step 2: Use Lovable AI to analyze prices from results
    const resultsText = results
      .map(
        (r: any, i: number) =>
          `Result ${i + 1}:\nURL: ${r.url}\nTitle: ${r.title || "N/A"}\nContent: ${(r.markdown || r.description || "").substring(0, 1500)}`
      )
      .join("\n\n---\n\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um analista de preços de peças para motores estacionários a gasolina e diesel no Brasil.
Analise os resultados de busca e extraia preços de concorrentes.
Responda APENAS com JSON válido, sem markdown.
O formato deve ser:
{
  "competitors": [
    {
      "name": "Nome da loja/vendedor",
      "url": "URL do anúncio",
      "price": 99.90,
      "source": "mercadolivre/shopee/site"
    }
  ],
  "suggested_price": 99.90,
  "analysis": "Breve análise em português do posicionamento de preço e sugestão"
}

Regras:
- Extraia APENAS preços reais encontrados nos resultados
- Se não encontrar preço claro, não invente
- O suggested_price deve considerar competitividade e margem saudável
- Nosso preço atual é R$ ${ourPrice}
- Produto: ${productName}${productSku ? ` (SKU: ${productSku})` : ""}`,
          },
          {
            role: "user",
            content: `Analise estes resultados de busca e extraia preços de concorrentes:\n\n${resultsText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_competitor_prices",
              description: "Extract competitor prices from search results",
              parameters: {
                type: "object",
                properties: {
                  competitors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        url: { type: "string" },
                        price: { type: "number" },
                        source: { type: "string" },
                      },
                      required: ["name", "price"],
                      additionalProperties: false,
                    },
                  },
                  suggested_price: { type: "number" },
                  analysis: { type: "string" },
                },
                required: ["competitors", "suggested_price", "analysis"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_competitor_prices" } },
      }),
    });

    if (!aiResponse.ok) {
      const aiErr = await aiResponse.text();
      console.error("AI error:", aiResponse.status, aiErr);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Limite de requisições IA excedido. Tente novamente em breve." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Créditos de IA insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "Erro na análise de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let analysis: any = { competitors: [], suggested_price: ourPrice, analysis: "Não foi possível analisar" };

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
    }

    // Step 3: Save results to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (productId && analysis.competitors?.length > 0) {
      const inserts = analysis.competitors.map((c: any) => ({
        product_id: productId,
        competitor_name: c.name || "Desconhecido",
        competitor_url: c.url || null,
        competitor_price: c.price || null,
        our_price: ourPrice,
        price_difference: c.price ? ourPrice - c.price : null,
        price_difference_pct: c.price ? ((ourPrice - c.price) / c.price) * 100 : null,
        suggested_price: analysis.suggested_price,
        ai_analysis: analysis.analysis,
        search_query: searchTerms,
        raw_results: results.map((r: any) => ({ url: r.url, title: r.title })),
      }));

      const { error: dbErr } = await supabase.from("price_research").insert(inserts);
      if (dbErr) console.error("DB insert error:", dbErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          competitors: analysis.competitors || [],
          suggested_price: analysis.suggested_price,
          analysis: analysis.analysis,
          our_price: ourPrice,
          search_results_count: results.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("research-prices error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
