-- Update existing partner_type values from 'revendedor' to 'fornecedor'
UPDATE public.mechanics SET partner_type = 'fornecedor' WHERE partner_type = 'revendedor';
