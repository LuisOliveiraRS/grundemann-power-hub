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

    const { products, format, campaignType, customSlogan, customCta, layoutMode } = await req.json();

    if (!products || products.length === 0) throw new Error("Nenhum produto fornecido");

    const isStory = format === "story_instagram";
    const isGrid = layoutMode === "grid2x2" && products.length >= 2;

    // Build the prompt based on layout mode
    let prompt: string;

    if (isGrid) {
      const productDetails = products.slice(0, 4).map((p: any, i: number) => 
        `Produto ${i + 1}: "${p.name}" - Preço: R$ ${Number(p.price).toFixed(2)}${p.description ? ` - ${p.description.slice(0, 60)}` : ""}`
      ).join("\n");

      prompt = `Create a professional commercial advertisement flyer for "Gründemann Oficina Geradores" - a Brazilian industrial parts store.

FORMAT: ${isStory ? "Vertical 9:16 (1080x1920)" : "Square 1:1 (1080x1080)"}

LAYOUT: Grid with ${Math.min(products.length, 4)} product cards arranged in a 2x2 grid.

PRODUCTS:
${productDetails}

DESIGN REQUIREMENTS:
- Dark industrial/workshop atmospheric background with warm amber/golden tones and dramatic lighting
- Each product should be in its own rounded card/frame with clean white or light gray background inside
- Each card should have: product name as header in a dark green (#006B3F) bar, the product image prominently displayed, price in large bold gold/yellow text (R$ format), and a green "COMPRAR" button at the bottom
- Company branding: "Gründemann" logo text in dark green elegant script at the top, with "Oficina Geradores" subtitle
- Contact info at top-right: "51-981825748" and "adair.grundemann@gmail.com"
- Green footer bar with address: "Luiz Bernardo da Silva, 190 - Pinheiro - São Leopoldo - R.S"
${customSlogan ? `- Include promotional banner/strip with text: "${customSlogan}" in gold text on dark blue background` : ""}
- Professional commercial photography style, high contrast, premium feel
- Color palette: dark backgrounds (#1a1a1a to #2a2a2a), green accents (#006B3F), gold/yellow prices (#FFDF00), white text for contrast
- Typography should be bold, modern, and highly readable`;
    } else {
      const p = products[0];
      prompt = `Create a professional commercial advertisement for "Gründemann Oficina Geradores" - a Brazilian industrial parts store.

FORMAT: ${isStory ? "Vertical 9:16 portrait (1080x1920)" : "Square 1:1 (1080x1080)"}

PRODUCT: "${p.name}"
PRICE: R$ ${Number(p.price).toFixed(2)}
${p.originalPrice ? `ORIGINAL PRICE: R$ ${Number(p.originalPrice).toFixed(2)} (show crossed out)` : ""}
INSTALLMENTS: 3x de R$ ${(Number(p.price) / 3).toFixed(2)} sem juros
${p.description ? `DESCRIPTION: ${p.description.slice(0, 100)}` : ""}

DESIGN REQUIREMENTS:
- Dark industrial/workshop atmospheric background with warm amber/golden bokeh lighting effects and subtle mechanical elements (gears, tools) blurred in background
- The product should be the HERO element - large, centered, prominently displayed with dramatic lighting and subtle shadow/glow
- Company branding at top-left: "Gründemann" in elegant dark green script with decorative leaf/wave flourish, "Oficina Geradores" subtitle below
- Contact info top-right: phone "51-981825748" in bold, email "adair.grundemann@gmail.com" below
- Subtitle: "peças: Diesel, gasolina, geradores e oficina"
${customSlogan ? `- Badge/label: "${customSlogan}" in a gold/orange rounded badge with star decorations` : `- Badge: "LANÇAMENTO" or "PROMOÇÃO" in gold/orange rounded badge`}
- Product name in large BOLD white uppercase text, with technical specs below in gold/amber
- Price display: "Por" in small text, then the price in VERY LARGE bold gold/yellow (#FFDF00) text, with "R$" prefix
- Installment text below price: "ou 3x de R$ XX,XX sem juros" in white
- CTA button: "${customCta || 'CONFIRA JÁ'}" in a dark rounded button with gold border and arrow icon, at bottom-left
- Green footer strip with address: "Luiz Bernardo da Silva, 190 - Pinheiro - São Leopoldo - R.S"
- 5 gold stars (★★★★★) near the product name for quality indicator
- Overall feel: premium, professional, industrial, trust-inspiring
- Color palette: dark warm backgrounds (#1a1a1a to #3a2a1a), green brand (#006B3F), gold/yellow prices (#FFDF00), warm amber highlights, white text
- High contrast, dramatic lighting, commercial photography quality`;
    }

    // Build messages with product images
    const content: any[] = [{ type: "text", text: prompt }];

    // Add product images
    const prodsToUse = isGrid ? products.slice(0, 4) : [products[0]];
    for (const p of prodsToUse) {
      if (p.imageUrl) {
        content.push({
          type: "image_url",
          image_url: { url: p.imageUrl }
        });
        content.push({
          type: "text",
          text: `Above image is the product "${p.name}" - incorporate it prominently in the ad design.`
        });
      }
    }

    console.log("Generating creative with AI model, products:", prodsToUse.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content }],
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
      throw new Error("Erro na geração da arte criativa");
    }

    const aiData = await response.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      // Fallback: try with flash model
      console.log("Pro model didn't return image, trying flash model...");
      const fallbackResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content }],
          modalities: ["image", "text"],
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error("Erro na geração da arte criativa (fallback)");
      }

      const fallbackData = await fallbackResponse.json();
      const fallbackImage = fallbackData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!fallbackImage) {
        throw new Error("Nenhuma imagem foi gerada pela IA");
      }

      return new Response(JSON.stringify({ success: true, image_url: fallbackImage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, image_url: imageData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-creative-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
