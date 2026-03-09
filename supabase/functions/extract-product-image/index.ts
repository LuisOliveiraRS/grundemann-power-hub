import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Usuário não autenticado");

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Acesso negado: apenas administradores");

    const { pdfBase64, productName, imageDescription, pageNumber, sku } = await req.json();
    if (!pdfBase64 || !productName) throw new Error("Dados insuficientes");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    // Step 1: Use Gemini vision to analyze the PDF page and get a detailed description of the product image
    const visionPrompt = `Analise este catálogo PDF e encontre o produto "${productName}" ${pageNumber ? `(página ${pageNumber})` : ""}.
${imageDescription ? `Descrição visual conhecida: ${imageDescription}` : ""}

Descreva a imagem/foto deste produto no catálogo com MÁXIMO DETALHE possível para que eu possa reproduzir a imagem fielmente:
- Formato exato da peça (cilíndrica, retangular, irregular, etc.)
- Material aparente (metal, plástico, borracha, etc.) e cor exata
- Detalhes visuais: furos, roscas, aletas, conexões, marcações, setas, textos gravados
- Ângulo da foto (frontal, lateral, perspectiva, vista explodida)
- Proporções e dimensões relativas
- Qualquer detalhe que torne esta peça única e identificável
- Marca ou números visíveis na peça

Responda APENAS com a descrição visual detalhada, sem explicações adicionais.`;

    const visionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: visionPrompt },
              {
                type: "image_url",
                image_url: { url: `data:application/pdf;base64,${pdfBase64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      const t = await visionResponse.text();
      console.error("Vision error:", visionResponse.status, t);
      throw new Error("Erro na análise visual do PDF");
    }

    const visionData = await visionResponse.json();
    const detailedDescription = visionData.choices?.[0]?.message?.content || imageDescription || productName;

    console.log(`Detailed description for "${productName}":`, detailedDescription.substring(0, 200));

    // Step 2: Use Gemini image generation to create a faithful reproduction
    const imagePrompt = `Create a PRECISE, FAITHFUL product photograph that exactly matches this industrial part/product from a catalog:

Product: ${productName}
Detailed visual description from catalog: ${detailedDescription}

CRITICAL INSTRUCTIONS:
- Reproduce the EXACT product as described - this is a real industrial/mechanical part
- Match the exact shape, material, color, proportions, and details described
- Product photo on a clean white background
- Professional e-commerce style photography, well-lit, centered
- NO text, NO watermarks, NO labels on the image
- Show the product at the SAME angle as described
- If it's a metal part, show realistic metallic finish
- If it's a filter, show the exact filter type (cylindrical, flat, etc.)
- The image must look like a real product photo, not an illustration`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      if (imageResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (imageResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await imageResponse.text();
      console.error("Image gen error:", imageResponse.status, t);
      throw new Error("Erro na geração de imagem");
    }

    const aiData = await imageResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(JSON.stringify({ success: false, error: "IA não gerou imagem" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract base64 and upload to storage
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Formato de imagem inválido");

    const imgExt = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const imgBytes = Uint8Array.from(atob(base64Match[2]), c => c.charCodeAt(0));

    const slug = (sku || productName)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const path = `products/${slug}/imagem-principal.${imgExt}`;

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { error: uploadError } = await adminClient.storage
      .from("product-images")
      .upload(path, imgBytes, {
        contentType: `image/${base64Match[1]}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Erro ao salvar imagem no storage");
    }

    const { data: urlData } = adminClient.storage.from("product-images").getPublicUrl(path);

    return new Response(JSON.stringify({ success: true, imageUrl: urlData?.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-product-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
