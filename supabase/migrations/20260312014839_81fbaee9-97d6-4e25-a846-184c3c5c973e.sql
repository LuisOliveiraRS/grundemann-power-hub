
-- Add parent_id to subcategories for tree nesting (subcategory of subcategory)
ALTER TABLE public.subcategories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Create junction table for products in multiple categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, category_id)
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view product_categories
CREATE POLICY "Anyone can view product_categories" ON public.product_categories FOR SELECT TO public USING (true);

-- Admins can manage product_categories
CREATE POLICY "Admins can manage product_categories" ON public.product_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
