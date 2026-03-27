
-- Junction table for multi-category product linking
CREATE TABLE IF NOT EXISTS public.product_menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  menu_category_id uuid NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, menu_category_id)
);

ALTER TABLE public.product_menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage product_menu_cats" ON public.product_menu_categories
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Anyone view product_menu_cats" ON public.product_menu_categories
  FOR SELECT TO public USING (true);

-- Fix HP filter in fuzzy search to handle variations like "5HP", "5 HP", "5"
CREATE OR REPLACE FUNCTION public.fuzzy_search_products(search_term text, hp_filter text DEFAULT NULL::text, result_limit integer DEFAULT 20)
RETURNS TABLE(id uuid, name text, sku text, brand text, hp text, price numeric, image_url text, tags text[], similarity_score real)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    p.id, p.name, p.sku, p.brand, p.hp, p.price, p.image_url, p.tags,
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
    AND (hp_filter IS NULL 
         OR TRIM(LOWER(COALESCE(p.hp, ''))) = TRIM(LOWER(hp_filter))
         OR REGEXP_REPLACE(TRIM(LOWER(COALESCE(p.hp, ''))), '[^0-9.]', '', 'g') = REGEXP_REPLACE(TRIM(LOWER(hp_filter)), '[^0-9.]', '', 'g')
    )
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
