
-- Add fuel_type and slug columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fuel_type text DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text DEFAULT NULL;

-- Create unique index on slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON public.products (slug) WHERE slug IS NOT NULL;

-- Generate slugs for existing products
UPDATE public.products
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(name, 'áàâãéèêíïóôõúüçÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ', 'aaaaeeeiiooouucAAAAEEEIIOOOUUC'),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
) || '-' || LEFT(id::text, 8)
WHERE slug IS NULL;
