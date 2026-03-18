
-- Update technical_catalogs categories from "Revendedor" to "Fornecedor"
UPDATE public.technical_catalogs
SET category = REPLACE(category, 'Revendedor', 'Fornecedor')
WHERE category ILIKE 'Revendedor%';

-- Add 'locadora' to the app_role enum if not exists
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'fornecedor';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'locadora';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mecanico';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'oficina';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
