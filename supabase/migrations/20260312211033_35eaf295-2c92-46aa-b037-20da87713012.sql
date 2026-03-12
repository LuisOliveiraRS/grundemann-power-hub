
-- Add partner_type column to mechanics table to distinguish mecanico/oficina/revendedor
ALTER TABLE public.mechanics ADD COLUMN IF NOT EXISTS partner_type text NOT NULL DEFAULT 'mecanico';

-- Add comment for clarity
COMMENT ON COLUMN public.mechanics.partner_type IS 'Type of partner: mecanico, oficina, or revendedor';
