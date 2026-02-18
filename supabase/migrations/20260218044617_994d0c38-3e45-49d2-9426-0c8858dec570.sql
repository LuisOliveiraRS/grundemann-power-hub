
-- Create subcategories table
CREATE TABLE public.subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Enable RLS
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Anyone can view subcategories
CREATE POLICY "Anyone can view subcategories"
ON public.subcategories FOR SELECT
USING (true);

-- Admins can manage subcategories
CREATE POLICY "Admins can manage subcategories"
ON public.subcategories FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Add subcategory_id to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL;
