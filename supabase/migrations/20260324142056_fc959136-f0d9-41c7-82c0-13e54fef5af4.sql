
ALTER TABLE public.hero_banners
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS background_image_url text,
  ADD COLUMN IF NOT EXISTS cta_text text DEFAULT 'COMPRAR';
