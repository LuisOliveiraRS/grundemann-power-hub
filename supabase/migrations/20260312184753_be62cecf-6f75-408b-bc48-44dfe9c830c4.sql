
-- Create unified menu_categories table
CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid,
  display_order integer NOT NULL DEFAULT 0,
  icon text DEFAULT '',
  image_url text DEFAULT '',
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view menu_categories" ON public.menu_categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage menu_categories" ON public.menu_categories FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Migrate existing categories as top-level entries (preserving IDs)
INSERT INTO public.menu_categories (id, name, slug, parent_id, display_order, image_url, description, is_active, created_at)
SELECT id, name, slug, NULL, 0, COALESCE(image_url, ''), COALESCE(description, ''), is_visible, created_at
FROM public.categories;

-- Migrate subcategories with parent_id IS NULL (direct children of categories)
INSERT INTO public.menu_categories (id, name, slug, parent_id, display_order, image_url, description, is_active, created_at)
SELECT id, name, slug, category_id, 0, COALESCE(image_url, ''), COALESCE(description, ''), true, created_at
FROM public.subcategories
WHERE parent_id IS NULL;

-- Migrate nested subcategories (parent_id IS NOT NULL)
INSERT INTO public.menu_categories (id, name, slug, parent_id, display_order, image_url, description, is_active, created_at)
SELECT id, name, slug, parent_id, 0, COALESCE(image_url, ''), COALESCE(description, ''), true, created_at
FROM public.subcategories
WHERE parent_id IS NOT NULL;

-- Add self-referencing FK
ALTER TABLE public.menu_categories ADD CONSTRAINT menu_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.menu_categories(id) ON DELETE CASCADE;

-- Add menu_category_id to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS menu_category_id uuid REFERENCES public.menu_categories(id);

-- Populate from existing data (prefer subcategory_id over category_id)
UPDATE public.products SET menu_category_id = COALESCE(subcategory_id, category_id);
