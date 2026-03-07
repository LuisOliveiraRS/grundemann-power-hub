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

    const { content, fileType, fileName } = await req.json();
    if (!content) throw new Error("Conteúdo do arquivo não fornecido");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é um assistente especializado em extrair dados de produtos de catálogos industriais.
Analise o conteúdo fornecido e extraia TODOS os produtos encontrados.

Para cada produto, extraia:
- name: Nome do produto (obrigatório)
- sku: Código/SKU se disponível
- description: Descrição completa incluindo especificações técnicas, compatibilidade, peso, dimensões
- category: Categoria sugerida (ex: Filtros, Peças para Motores, Motores Estacionários, Geradores, Peças de Reposição, Carburadores, Bombas, Acessórios)
- price: Preço se disponível (apenas número, sem R$)
- brand: Marca se identificável

IMPORTANTE:
- Extraia TODOS os produtos, mesmo que sejam dezenas ou centenas
- Se houver tabelas, interprete cada linha como um produto
- Se houver listas descritivas, identifique cada item como produto
- Para catálogos sem tabela, interprete descrições de texto para encontrar produtos
- Sempre tente inferir a categoria mais adequada
- Se não encontrar preço, deixe como null`;

    const userPrompt = `Tipo do arquivo: ${fileType}
Nome do arquivo: ${fileName}

Conteúdo do documento:
${content.substring(0, 60000)}

Extraia todos os produtos encontrados neste documento.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "extract_products",
              description: "Retorna a lista de produtos extraídos do catálogo",
              parameters: {
                type: "object",
                properties: {
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nome do produto" },
                        sku: { type: "string", description: "Código/SKU" },
                        description: { type: "string", description: "Descrição completa" },
                        category: { type: "string", description: "Categoria sugerida" },
                        price: { type: "number", description: "Preço" },
                        brand: { type: "string", description: "Marca" },
                      },
                      required: ["name"],
                    },
                  },
                },
                required: ["products"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_products" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Erro no processamento de IA");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let products = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      products = parsed.products || [];
    }

    return new Response(JSON.stringify({ success: true, products }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-catalog error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
