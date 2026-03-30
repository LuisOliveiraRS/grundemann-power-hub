/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// Este arquivo é executado como função Supabase Edge (Deno) e não como parte do bundle React.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normalizeSlug = (input: string) =>
  String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureUrl = (url: string) => url.replace(/\/$/, "");

const normalizeSourceUrl = (source: string) => {
  let trimmed = String(source || "").trim();
  if (!trimmed) throw new Error("Fonte Lovable inválida");
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    return ensureUrl(parsed.toString());
  } catch {
    throw new Error(`Fonte Lovable inválida: ${source}`);
  }
};

const fetchJson = async (url: string, retries = 2): Promise<unknown> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const body = await res.text().catch(() => "<no body>");
        throw new Error(`HTTP ${res.status} fetching ${url} - ${res.statusText} - body: ${body}`);
      }
      return res.json();
    } catch (error) {
      lastError = error;
      if (attempt <= retries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }
  throw new Error(`Failed to fetch JSON from ${url}: ${String(lastError)}`);
};

const fetchText = async (url: string, retries = 2): Promise<string> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text().catch(() => "<no body>");
        throw new Error(`HTTP ${res.status} fetching ${url} - ${res.statusText} - body: ${body}`);
      }
      return res.text();
    } catch (error) {
      lastError = error;
      if (attempt <= retries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }
  throw new Error(`Failed to fetch text from ${url}: ${String(lastError)}`);
};

const parseHTML = async (html: string) => {
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM(html);
  return dom.window.document;
};

const fetchLovableCategories = async (source: string) => {
  const base = normalizeSourceUrl(source);
  const candidateUrls = [`${base}/api/categories`, `${base}/api/v1/categories`, `${base}/categories`, `${base}/api/product_categories`];

  for (const url of candidateUrls) {
    try {
      const data = await fetchJson(url);
      const safeData = data as { data?: unknown };
      const items = Array.isArray(data) ? data : Array.isArray(safeData.data) ? safeData.data : [];

      if (items.length > 0) {
        return items
          .map((item: unknown) => {
            const cat = item as Record<string, unknown>;
            const idRaw = cat.id ?? cat._id ?? cat.slug ?? cat.name;
            const nameRaw = cat.name ?? cat.title ?? "";
            const slugRaw = cat.slug ?? cat.name ?? nameRaw;
            return {
              id: String(idRaw ?? "").trim(),
              name: String(nameRaw ?? "").trim(),
              slug: normalizeSlug(String(slugRaw ?? "")),
              description: typeof cat.description === "string" ? cat.description : null,
              image_url: typeof cat.image_url === "string" ? cat.image_url : typeof cat.image === "string" ? cat.image : null,
            };
          })
          .filter((cat) => Boolean(cat.name));
      }
    } catch {
      // tenta próxima URL
    }
  }

  const html = await fetchText(`${base}/`);
  const doc = await parseHTML(html);
  const nodes = doc.querySelectorAll("a[href*='categoria'], a[href*='category']");
  const categories: Array<{ id: string; name: string; slug: string }> = [];

  nodes.forEach((node) => {
    const text = node.textContent?.trim();
    const href = node.getAttribute("href") || "";
    if (!text) return;
    const slug = normalizeSlug(href.replace(/^\/?(categoria|category)\/?/, "").replace(/\?.*$/, "").replace(/\/$/, "")) || normalizeSlug(text);
    categories.push({ id: slug, name: text, slug });
  });

  return categories;
};

interface LovableCategory { id: string; name: string; slug: string; description?: string | null; image_url?: string | null }
interface LovableProduct { id: string; name: string; slug?: string; description?: string | null; sku?: string | null; price?: number | null; original_price?: number | null; image_url?: string | null; brand?: string | null; stock_quantity?: number | null; category_slug?: string; tags?: string[]; attributes?: Record<string, unknown> | null }

const fetchLovableProductsForCategory = async (source: string, category: LovableCategory): Promise<LovableProduct[]> => {
  const base = normalizeSourceUrl(source);
  const candidateUrls = [
    `${base}/api/products?category=${encodeURIComponent(category.id ?? "")}`,
    `${base}/api/v1/products?category_id=${encodeURIComponent(category.id ?? "")}`,
    `${base}/api/products?category_slug=${encodeURIComponent(category.slug)}`,
    `${base}/api/v1/products?category_slug=${encodeURIComponent(category.slug)}`,
  ];

  for (const url of candidateUrls) {
    try {
      const data = await fetchJson(url);
      const safeData = data as { data?: unknown };
      const items = Array.isArray(data) ? data : Array.isArray(safeData.data) ? safeData.data : [];

      if (items.length > 0) {
        return items
          .map((item: unknown) => {
            const product = item as Record<string, unknown>;
            const idRaw = product.id ?? product._id ?? product.sku ?? product.slug ?? product.name;
            const nameRaw = product.name ?? product.title ?? "";
            const slugRaw = product.slug ?? product.sku ?? product.name ?? nameRaw;
            const tagsRaw = product.tags;
            const price = product.price != null ? Number(product.price) : null;
            const original_price = product.original_price != null ? Number(product.original_price) : null;
            const stock_quantity = product.stock_quantity != null ? Number(product.stock_quantity) : null;

            return {
              id: String(idRaw ?? "").trim(),
              name: String(nameRaw ?? "").trim(),
              slug: normalizeSlug(String(slugRaw ?? "")),
              description:
                typeof product.description === "string"
                  ? product.description
                  : typeof product.short_description === "string"
                  ? product.short_description
                  : null,
              sku: typeof product.sku === "string" ? product.sku : null,
              price,
              original_price,
              image_url:
                typeof product.image_url === "string"
                  ? product.image_url
                  : typeof product.image === "string"
                  ? product.image
                  : null,
              brand: typeof product.brand === "string" ? product.brand : typeof product.make === "string" ? product.make : null,
              stock_quantity,
              category_slug: category.slug,
              tags: Array.isArray(tagsRaw) ? (tagsRaw as string[]).map((x) => String(x)) : typeof tagsRaw === "string" ? tagsRaw.split(",").map((x) => x.trim()) : [],
              attributes: product.attributes && typeof product.attributes === "object" ? (product.attributes as Record<string, unknown>) : null,
            };
          })
          .filter((p) => Boolean(p.name));
      }
    } catch {
      // tenta próxima URL
    }
  }

  const categoryUrl = `${base}/categoria/${category.slug}`;
  const html = await fetchText(categoryUrl).catch(() => "");
  if (!html) return [];

  const doc = await parseHTML(html);
  const products: LovableProduct[] = [];

  doc.querySelectorAll(".product-item, .product-card, [data-product]").forEach((node) => {
    const name = (node.querySelector(".product-name, .card-title, h2")?.textContent || "").trim();
    if (!name) return;
    const priceText = (node.querySelector(".product-price, .price")?.textContent || "").replace(/[^0-9,.]/g, "");
    const price = priceText ? Number(priceText.replace(/\./g, "").replace(/,/g, ".")) : null;
    const imageUrl = (node.querySelector("img") as HTMLImageElement | null)?.src ?? null;

    products.push({
      id: `${category.slug}-${normalizeSlug(name)}`,
      name,
      slug: normalizeSlug(name),
      description: (node.querySelector(".product-desc, .description")?.textContent || "").trim() || null,
      price,
      image_url: imageUrl,
      category_slug: category.slug,
    });
  });

  return products;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase config não encontrada");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso negado: apenas admin" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const source = String(body.source || "").trim();
    if (!source) {
      return new Response(JSON.stringify({ error: "source é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const categories = await fetchLovableCategories(source);
    if (categories.length === 0) throw new Error("Nenhuma categoria encontrada no site Lovable");

    let importedProducts = 0;
    let failedProducts = 0;
    const logs: string[] = [];

    for (const category of categories) {
      const catSlug = normalizeSlug(category.slug || category.name);
      const { error: catError } = await supabase.from("categories").upsert({
        name: category.name,
        slug: catSlug,
        description: category.description ?? null,
        image_url: category.image_url ?? null,
      }, { onConflict: "slug" });
      if (catError) throw catError;

      const { data: dbCat, error: catSelectError } = await supabase.from("categories").select("id").eq("slug", catSlug).single();
      if (catSelectError || !dbCat) throw catSelectError ?? new Error("Categoria não encontrada após upsert");
      const categoryId = dbCat.id;

      const products = await fetchLovableProductsForCategory(source, category);

      for (const product of products) {
        try {
          const productSlug = normalizeSlug(product.slug || product.name);
          const upsertPayload: Record<string, unknown> = {
            name: product.name,
            slug: productSlug,
            sku: product.sku ?? null,
            description: product.description ?? null,
            price: product.price ?? 0,
            original_price: product.original_price ?? null,
            image_url: product.image_url ?? null,
            brand: product.brand ?? null,
            stock_quantity: product.stock_quantity ?? 0,
            category_id: categoryId,
            is_active: true,
          };

          await supabase.from("products").upsert(upsertPayload, { onConflict: product.sku ? "sku" : "slug" });
          importedProducts += 1;
        } catch (error) {
          failedProducts += 1;
          logs.push(`Falha produto ${product.name}: ${String(error)}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ importedCategories: categories.length, importedProducts, failedProducts, logs }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("import-lovable error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
