
-- Table for generator/engine models
CREATE TABLE public.generator_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  engine_type text DEFAULT 'gasolina',
  hp text,
  displacement_cc text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Junction table: product <-> model compatibility
CREATE TABLE public.product_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.generator_models(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, model_id)
);

-- Indexes
CREATE INDEX idx_generator_models_name_trgm ON public.generator_models USING gin (name gin_trgm_ops);
CREATE INDEX idx_generator_models_brand ON public.generator_models(brand);
CREATE INDEX idx_product_models_product ON public.product_models(product_id);
CREATE INDEX idx_product_models_model ON public.product_models(model_id);

-- RLS for generator_models
ALTER TABLE public.generator_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active models"
  ON public.generator_models FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage models"
  ON public.generator_models FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS for product_models
ALTER TABLE public.product_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product_models"
  ON public.product_models FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product_models"
  ON public.product_models FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Function to find compatible products by model name (fuzzy)
CREATE OR REPLACE FUNCTION public.search_compatible_products(
  model_search text,
  result_limit integer DEFAULT 20
)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  product_sku text,
  product_price numeric,
  product_image text,
  product_hp text,
  model_id uuid,
  model_name text,
  model_brand text,
  compatibility_notes text,
  match_score real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    p.price AS product_price,
    p.image_url AS product_image,
    p.hp AS product_hp,
    gm.id AS model_id,
    gm.name AS model_name,
    gm.brand AS model_brand,
    pm.notes AS compatibility_notes,
    GREATEST(
      similarity(gm.name, model_search),
      CASE WHEN gm.name ILIKE '%' || model_search || '%' THEN 0.9 ELSE 0 END,
      CASE WHEN gm.brand ILIKE '%' || model_search || '%' THEN 0.5 ELSE 0 END
    ) AS match_score
  FROM product_models pm
  JOIN products p ON p.id = pm.product_id AND p.is_active = true
  JOIN generator_models gm ON gm.id = pm.model_id AND gm.is_active = true
  WHERE
    gm.name ILIKE '%' || model_search || '%'
    OR gm.brand ILIKE '%' || model_search || '%'
    OR similarity(gm.name, model_search) > 0.2
  ORDER BY match_score DESC, p.name ASC
  LIMIT result_limit;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_generator_models_updated_at
  BEFORE UPDATE ON public.generator_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
