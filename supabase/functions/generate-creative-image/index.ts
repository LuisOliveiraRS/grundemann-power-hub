import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL = "https://hodtsmyjqtkjlkburoea.supabase.co/storage/v1/object/public/product-images/marketing%2Flogo-grundemann-banner.png";

const STYLE_CONFIGS = {
  dark_industrial: {
    background: "Dark industrial/workshop atmospheric background with warm amber/golden bokeh lighting effects, subtle mechanical elements (gears, engine parts, tools) blurred in background, dramatic shadows and warm highlights",
    colors: "Dark warm backgrounds (#1a1a1a to #3a2a1a), brand green accents (#009739), gold/yellow prices (#FFDF00), warm amber highlights, white text for contrast",
    feel: "Premium, industrial, powerful, trust-inspiring. High contrast, dramatic cinematic lighting, commercial photography quality",
    priceColor: "VERY LARGE bold gold/yellow (#FFDF00)",
    cardBg: "dark semi-transparent cards with subtle glow borders",
  },
  clean_modern: {
    background: "Clean, bright white/light gray gradient background with subtle geometric patterns or soft diagonal lines. Minimal and elegant with plenty of whitespace",
    colors: "White/light gray backgrounds (#f8f9fa to #ffffff), brand green (#009739) for accents and headers, dark navy blue (#002776) for text, subtle gray borders, clean typography",
    feel: "Modern, minimalist, professional, trustworthy. Clean lines, generous whitespace, elegant sans-serif typography. Apple/corporate catalog style",
    priceColor: "VERY LARGE bold dark green (#009739) or navy blue (#002776)",
    cardBg: "white cards with subtle shadow and thin green border",
  },
  colorful_vibrant: {
    background: "Vibrant gradient background blending brand green (#009739), royal blue (#002776), and energetic yellow/gold (#FFDF00). Dynamic diagonal stripes or bold geometric shapes. Energetic and eye-catching",
    colors: "Vibrant green (#009739), bold blue (#002776), energetic yellow (#FFDF00), white text, bright orange accents for urgency. High saturation throughout",
    feel: "Energetic, bold, exciting, attention-grabbing. Pop art influenced, dynamic angles, burst/starburst shapes for promotions. Festival/sale vibe",
    priceColor: "VERY LARGE bold white text on colored badge/starburst, or bright yellow (#FFDF00) on dark background",
    cardBg: "bold colored cards with rounded corners and thick white borders",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const { products, format, campaignType, customSlogan, customCta, layoutMode, creativeStyle = "dark_industrial", customColors } = await req.json();

    if (!products || products.length === 0) throw new Error("Nenhum produto fornecido");

    const isStory = format === "story_instagram";
    const isGrid = layoutMode === "grid2x2" && products.length >= 2;

    let style: any;
    if (creativeStyle === "custom" && customColors) {
      style = {
        background: `Background using these colors: main background ${customColors.background}, with subtle atmospheric effects. Accent color ${customColors.accent} for borders and decorative elements`,
        colors: `Background: ${customColors.background}, Accent/borders: ${customColors.accent}, Price text: ${customColors.priceColor}, Body text: ${customColors.textColor}, Card backgrounds: ${customColors.cardBg}`,
        feel: "Professional, custom-branded commercial design. High contrast, clean layout with premium feel. Commercial photography quality",
        priceColor: `VERY LARGE bold ${customColors.priceColor}`,
        cardBg: `cards with background color ${customColors.cardBg} and ${customColors.accent} accent borders`,
      };
    } else {
      style = STYLE_CONFIGS[creativeStyle as keyof typeof STYLE_CONFIGS] || STYLE_CONFIGS.dark_industrial;
    }

    let prompt: string;

    if (isGrid) {
      const productDetails = products.slice(0, 4).map((p: any, i: number) =>
        `Produto ${i + 1}: "${p.name}" - Preço: R$ ${Number(p.price).toFixed(2)}${p.description ? ` - ${p.description.slice(0, 60)}` : ""}`
      ).join("\n");

      prompt = `Create a professional commercial advertisement flyer for "Gründemann Oficina Geradores" - a Brazilian industrial parts and generators store.

FORMAT: ${isStory ? "Vertical 9:16 (1080x1920)" : "Square 1:1 (1080x1080)"}

LAYOUT: Grid with ${Math.min(products.length, 4)} product cards arranged in a 2x2 grid.

PRODUCTS:
${productDetails}

VISUAL STYLE: ${style.feel}

DESIGN REQUIREMENTS:
- BACKGROUND: ${style.background}
- Each product should be in its own card: ${style.cardBg}
- Each card should have: product name as header, the product image prominently displayed, price in ${style.priceColor} (R$ format), and a green "COMPRAR" button at the bottom
- LOGO: The "Gründemann" brand logo MUST appear prominently at the TOP of the design, large and clearly visible (at least 20% of the width). The logo shows "Gründe" in green and "mann" in blue italic script with decorative green swooshes above. Include "Oficina Geradores" subtitle below.
- Contact info: "51-981825748" and "adair.grundemann@gmail.com"
- Green footer bar with address: "Luiz Bernardo da Silva, 190 - Pinheiro - São Leopoldo - R.S"
${customSlogan ? `- Include promotional banner/strip with text: "${customSlogan}"` : ""}
- COLOR PALETTE: ${style.colors}
- Typography should be bold, modern, and highly readable`;
    } else {
      const p = products[0];
      prompt = `Create a professional commercial advertisement for "Gründemann Oficina Geradores" - a Brazilian industrial parts and generators store.

FORMAT: ${isStory ? "Vertical 9:16 portrait (1080x1920)" : "Square 1:1 (1080x1080)"}

PRODUCT: "${p.name}"
PRICE: R$ ${Number(p.price).toFixed(2)}
${p.originalPrice ? `ORIGINAL PRICE: R$ ${Number(p.originalPrice).toFixed(2)} (show crossed out)` : ""}
INSTALLMENTS: 3x de R$ ${(Number(p.price) / 3).toFixed(2)} sem juros
${p.description ? `DESCRIPTION: ${p.description.slice(0, 100)}` : ""}

VISUAL STYLE: ${style.feel}

DESIGN REQUIREMENTS:
- BACKGROUND: ${style.background}
- The product should be the HERO element - large, centered, prominently displayed with dramatic lighting and subtle shadow/glow
- LOGO: The "Gründemann" brand logo MUST appear prominently at the TOP of the design, large and clearly visible (at least 20% of the width). The logo shows "Gründe" in green and "mann" in blue italic script with decorative green swooshes above. Include "Oficina Geradores" subtitle below.
- Contact info: phone "51-981825748", email "adair.grundemann@gmail.com"
- Subtitle: "peças: Diesel, gasolina, geradores e oficina"
${customSlogan ? `- Badge/label: "${customSlogan}" in a prominent decorative badge` : `- Badge: "LANÇAMENTO" or "PROMOÇÃO" in a decorative badge`}
- Product name in large BOLD uppercase text
- Price display: "Por" in small text, then the price in ${style.priceColor} text, with "R$" prefix
- Installment text below price: "ou 3x de R$ XX,XX sem juros"
- CTA button: "${customCta || 'CONFIRA JÁ'}" in a prominent styled button with arrow icon
- Green footer strip with address: "Luiz Bernardo da Silva, 190 - Pinheiro - São Leopoldo - R.S"
- 5 gold stars (★★★★★) near the product name for quality indicator
- COLOR PALETTE: ${style.colors}
- High quality commercial photography style`;
    }

    // Build messages with product images and logo
    const content: any[] = [{ type: "text", text: prompt }];

    // Add logo reference
    content.push({
      type: "image_url",
      image_url: { url: LOGO_URL }
    });
    content.push({
      type: "text",
      text: `Above is the official "Gründemann" logo. It MUST appear prominently and large at the top of the ad design, maintaining its original green and blue colors. Make sure it's clearly visible and well-sized (not tiny).`
    });

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

    console.log("Generating creative with AI model, style:", creativeStyle, "products:", prodsToUse.length);

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
