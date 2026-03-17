
-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add tags column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];

-- Create GIN trigram indexes for fuzzy search on products
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm ON public.products USING gin (sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON public.products USING gin (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_products_hp ON public.products USING btree (hp);

-- Create a fuzzy search function that searches across multiple fields
CREATE OR REPLACE FUNCTION public.fuzzy_search_products(
  search_term text,
  hp_filter text DEFAULT NULL,
  result_limit integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  name text,
  sku text,
  brand text,
  hp text,
  price numeric,
  image_url text,
  tags text[],
  similarity_score real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.sku,
    p.brand,
    p.hp,
    p.price,
    p.image_url,
    p.tags,
    GREATEST(
      COALESCE(similarity(p.name, search_term), 0),
      COALESCE(similarity(p.sku, search_term), 0),
      COALESCE(similarity(p.brand, search_term), 0),
      CASE WHEN p.tags && ARRAY[lower(search_term)] THEN 0.9
           WHEN EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE '%' || search_term || '%') THEN 0.7
           ELSE 0 END,
      CASE WHEN p.name ILIKE '%' || search_term || '%' THEN 0.8 ELSE 0 END,
      CASE WHEN p.sku ILIKE '%' || search_term || '%' THEN 0.85 ELSE 0 END,
      CASE WHEN p.engine_model ILIKE '%' || search_term || '%' THEN 0.6 ELSE 0 END,
      CASE WHEN p.description ILIKE '%' || search_term || '%' THEN 0.4 ELSE 0 END
    ) AS similarity_score
  FROM products p
  WHERE p.is_active = true
    AND (hp_filter IS NULL OR p.hp = hp_filter)
    AND (
      search_term = '' 
      OR p.name ILIKE '%' || search_term || '%'
      OR p.sku ILIKE '%' || search_term || '%'
      OR p.brand ILIKE '%' || search_term || '%'
      OR p.description ILIKE '%' || search_term || '%'
      OR p.engine_model ILIKE '%' || search_term || '%'
      OR p.hp ILIKE '%' || search_term || '%'
      OR similarity(p.name, search_term) > 0.15
      OR similarity(COALESCE(p.sku, ''), search_term) > 0.3
      OR similarity(COALESCE(p.brand, ''), search_term) > 0.3
      OR p.tags && ARRAY[lower(search_term)]
      OR EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE '%' || search_term || '%')
    )
  ORDER BY similarity_score DESC, p.name ASC
  LIMIT result_limit;
$$;
