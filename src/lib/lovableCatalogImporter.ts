import { SupabaseClient } from "@supabase/supabase-js";

export type SourceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
};

export type SourceProduct = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  sku?: string | null;
  price?: number | null;
  original_price?: number | null;
  image_url?: string | null;
  brand?: string | null;
  stock_quantity?: number | null;
  category_slug?: string;
  tags?: string[];
  attributes?: Record<string, unknown> | null;
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

const isValidUuid = (value?: string): value is string => {
  if (!value || typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
};

const parseHTML = async (html: string) => {
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
  }

  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM(html);
  return dom.window.document;
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
  throw new Error(`Failed to fetch JSON from ${url}: ${lastError}`);
};

const fetchText = async (url: string, retries = 2): Promise<string> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} fetching ${url} - ${res.statusText}`);
      }
      return res.text();
    } catch (error) {
      lastError = error;
      if (attempt <= retries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }
  throw new Error(`Failed to fetch text from ${url}: ${lastError}`);
};

export const fetchLovableCategories = async (source: string): Promise<SourceCategory[]> => {
  const base = normalizeSourceUrl(source);
  const candidateUrls = [`${base}/api/categories`, `${base}/api/v1/categories`, `${base}/categories`, `${base}/api/product_categories`];

  for (const url of candidateUrls) {
    try {
      const data = await fetchJson(url);
      const safeData = data as { data?: unknown };
      const items = Array.isArray(data)
        ? data
        : Array.isArray(safeData.data)
        ? safeData.data
        : [];

      if (items.length > 0) {
        return items
          .map((item) => {
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
            } as SourceCategory;
          })
          .filter((cat) => cat.name);
      }
    } catch {
      // try next URL
    }
  }

  const html = await fetchText(`${base}/`);

  const doc = await parseHTML(html);
  const nodes = doc.querySelectorAll("a[href*='categoria'], a[href*='category']");
  const categories: SourceCategory[] = [];

  nodes.forEach((node) => {
    const text = node.textContent?.trim();
    const href = node.getAttribute("href") || "";
    if (!text) return;
    const slug = normalizeSlug(href.replace(/^\/?(categoria|category)\/?/, "").replace(/\?.*$/, "").replace(/\/$/, "")) || normalizeSlug(text);
    categories.push({ id: slug, name: text, slug });
  });

  return categories;
};

export const fetchLovableProductsForCategory = async (source: string, category: SourceCategory): Promise<SourceProduct[]> => {
  const base = normalizeSourceUrl(source);
  const candidateUrls = [
    `${base}/api/products?category=${encodeURIComponent(category.id)}`,
    `${base}/api/v1/products?category_id=${encodeURIComponent(category.id)}`,
    `${base}/api/products?category_slug=${encodeURIComponent(category.slug)}`,
    `${base}/api/v1/products?category_slug=${encodeURIComponent(category.slug)}`,
  ];

  for (const url of candidateUrls) {
    try {
      const data = await fetchJson(url);
      const safeData = data as { data?: unknown };
      const items = Array.isArray(data)
        ? data
        : Array.isArray(safeData.data)
        ? safeData.data
        : [];

      if (items.length > 0) {
        return items
          .map((item) => {
            const product = item as Record<string, unknown>;
            const idRaw = product.id ?? product._id ?? product.sku ?? product.slug ?? product.name;
            const nameRaw = product.name ?? product.title ?? "";
            const slugRaw = product.slug ?? product.sku ?? product.name ?? nameRaw;
            const tagsRaw = product.tags;

            return {
              id: String(idRaw ?? "").trim(),
              name: String(nameRaw ?? "").trim(),
              slug: normalizeSlug(String(slugRaw ?? "")),
              description: typeof product.description === "string" ? product.description : typeof product.short_description === "string" ? product.short_description : null,
              sku: typeof product.sku === "string" ? product.sku : null,
              price: product.price != null ? Number(product.price) : null,
              original_price: product.original_price != null ? Number(product.original_price) : null,
              image_url: typeof product.image_url === "string" ? product.image_url : typeof product.image === "string" ? product.image : null,
              brand: typeof product.brand === "string" ? product.brand : typeof product.make === "string" ? product.make : null,
              stock_quantity: product.stock_quantity != null ? Number(product.stock_quantity) : null,
              category_slug: category.slug,
              tags: Array.isArray(tagsRaw) ? (tagsRaw as string[]).map((x) => String(x)) : typeof tagsRaw === "string" ? tagsRaw.split(",").map((x) => x.trim()) : [],
              attributes: product.attributes && typeof product.attributes === "object" ? (product.attributes as Record<string, unknown>) : null,
            } as SourceProduct;
          })
          .filter((p) => p.name);
      }
    } catch {
      // next URL
    }
  }

  const categoryUrl = `${base}/categoria/${category.slug}`;
  const html = await fetchText(categoryUrl).catch(() => "");
  if (!html) return [];

  const doc = await parseHTML(html);
  const products: SourceProduct[] = [];

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

const upsertCategory = async (supabase: SupabaseClient, category: SourceCategory) => {
  const slug = normalizeSlug(category.slug || category.name);
  const payload: Record<string, unknown> = {
    name: category.name,
    slug,
    description: category.description ?? null,
    image_url: category.image_url ?? null,
    is_visible: true,
  };

  if (isValidUuid(category.id)) {
    payload.id = category.id;
  }

  const { error } = await supabase.from("categories").upsert(payload, { onConflict: "slug" });
  if (error) throw error;
  return slug;
};

const upsertProduct = async (supabase: SupabaseClient, product: SourceProduct, categoryId: string | null) => {
  const slug = normalizeSlug(product.slug || product.name);
  const payload: Record<string, unknown> = {
    name: product.name,
    slug,
    sku: product.sku ?? null,
    description: product.description ?? null,
    price: product.price ?? 0,
    original_price: product.original_price ?? null,
    image_url: product.image_url ?? null,
    brand: product.brand ?? null,
    stock_quantity: product.stock_quantity ?? 0,
    category_id: categoryId,
    tags: product.tags ?? [],
    specifications: product.attributes ?? null,
    is_active: true,
  };

  if (isValidUuid(product.id)) {
    payload.id = product.id;
  }

  const conflictKey = product.sku ? "sku" : "slug";
  const { error } = await supabase.from("products").upsert(payload, { onConflict: conflictKey });
  if (error) throw error;
};

export type ImportResult = {
  importedCategories: number;
  importedProducts: number;
  failedProducts: number;
  logs: string[];
};

export const importLovableCatalog = async (
  supabase: SupabaseClient,
  source: string,
  onProgress?: (message: string) => void
): Promise<ImportResult> => {
  const logs: string[] = [];
  const base = normalizeSourceUrl(source);

  onProgress?.(`Buscando categorias em ${base}`);
  const categories = await fetchLovableCategories(base);
  if (categories.length === 0) {
    throw new Error("Nenhuma categoria encontrada no site Lovable");
  }

  let importedProducts = 0;
  let failedProducts = 0;

  for (const category of categories) {
    onProgress?.(`Importando categoria '${category.name}'`);
    const catSlug = await upsertCategory(supabase, category);
    const { data: dbCat } = await supabase.from("categories").select("id").eq("slug", catSlug).single();
    const categoryId = dbCat && typeof dbCat.id === "string" ? dbCat.id : null;

    const products = await fetchLovableProductsForCategory(base, category);
    onProgress?.(`Encontrados ${products.length} produtos em '${category.name}'`);

    for (const product of products) {
      try {
        await upsertProduct(supabase, product, categoryId);
        importedProducts += 1;
      } catch (error) {
        failedProducts += 1;
        logs.push(`Falha produto ${product.name}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      }
    }
  }

  return {
    importedCategories: categories.length,
    importedProducts,
    failedProducts,
    logs,
  };
};
