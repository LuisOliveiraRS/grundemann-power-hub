
-- =============================================
-- FASE 2: PRODUTO × REVENDEDOR (MARKETPLACE-READY)
-- =============================================

-- 1. Tabela relacional product_resellers
CREATE TABLE public.product_resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reseller_id uuid NOT NULL REFERENCES public.mechanics(id) ON DELETE CASCADE,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  custom_price numeric DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, reseller_id)
);

CREATE INDEX idx_product_resellers_product ON public.product_resellers(product_id);
CREATE INDEX idx_product_resellers_reseller ON public.product_resellers(reseller_id);

-- RLS
ALTER TABLE public.product_resellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active product_resellers"
ON public.product_resellers FOR SELECT
TO public
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage product_resellers"
ON public.product_resellers FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Resellers can view own product_resellers"
ON public.product_resellers FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM mechanics WHERE mechanics.id = product_resellers.reseller_id AND mechanics.user_id = auth.uid())
);

CREATE POLICY "Resellers can update own stock"
ON public.product_resellers FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM mechanics WHERE mechanics.id = product_resellers.reseller_id AND mechanics.user_id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_product_resellers_updated_at
BEFORE UPDATE ON public.product_resellers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. Function to sync reseller stock on order confirmation
CREATE OR REPLACE FUNCTION public.decrease_reseller_stock(
  p_order_id uuid,
  p_reseller_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item RECORD;
  v_count integer := 0;
BEGIN
  FOR item IN
    SELECT oi.product_id, oi.quantity
    FROM order_items oi
    WHERE oi.order_id = p_order_id AND oi.product_id IS NOT NULL
  LOOP
    UPDATE product_resellers
    SET stock_quantity = GREATEST(0, stock_quantity - item.quantity),
        updated_at = now()
    WHERE product_id = item.product_id AND reseller_id = p_reseller_id;
    
    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;
  
  RETURN jsonb_build_object('ok', true, 'updated', v_count);
END;
$$;
