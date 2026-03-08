import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const baseUrl = "https://grundemann-power-hub.lovable.app";

  // Static pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/produtos", priority: "0.9", changefreq: "daily" },
    { loc: "/central-tecnica", priority: "0.8", changefreq: "weekly" },
    { loc: "/catalogo-interativo", priority: "0.7", changefreq: "monthly" },
    { loc: "/quem-somos", priority: "0.5", changefreq: "monthly" },
    { loc: "/contato", priority: "0.5", changefreq: "monthly" },
    { loc: "/orcamento", priority: "0.6", changefreq: "monthly" },
    { loc: "/area-mecanico", priority: "0.6", changefreq: "monthly" },
    { loc: "/politica-privacidade", priority: "0.3", changefreq: "yearly" },
    { loc: "/termos-uso", priority: "0.3", changefreq: "yearly" },
    { loc: "/trocas-devolucoes", priority: "0.3", changefreq: "yearly" },
  ];

  // Fetch products
  const { data: products } = await supabase
    .from("products")
    .select("id, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, created_at")
    .eq("is_visible", true);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const page of staticPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  if (categories) {
    for (const cat of categories) {
      xml += `  <url>
    <loc>${baseUrl}/categoria/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
  }

  if (products) {
    for (const p of products) {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : "";
      xml += `  <url>
    <loc>${baseUrl}/produto/${p.id}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
  });
});
