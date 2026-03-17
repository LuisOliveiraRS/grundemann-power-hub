
-- =============================================
-- FASE 1: SISTEMA DE ESTOQUE SEGURO
-- =============================================

-- 1. Tabela de reservas de estoque
CREATE TABLE public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'released', 'expired')),
  reserved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  confirmed_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index para busca rápida
CREATE INDEX idx_stock_reservations_product ON public.stock_reservations(product_id, status);
CREATE INDEX idx_stock_reservations_order ON public.stock_reservations(order_id);
CREATE INDEX idx_stock_reservations_expires ON public.stock_reservations(expires_at) WHERE status = 'reserved';

-- RLS
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations"
ON public.stock_reservations FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = stock_reservations.order_id AND orders.user_id = auth.uid())
  OR is_admin()
);

CREATE POLICY "Admins can manage reservations"
ON public.stock_reservations FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 2. Função para reservar estoque (transacional e segura)
CREATE OR REPLACE FUNCTION public.reserve_stock(
  p_order_id uuid,
  p_items jsonb -- array of {product_id, quantity}
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_available integer;
  v_reserved integer;
  v_result jsonb := '[]'::jsonb;
BEGIN
  -- Validate all items have sufficient stock FIRST
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'product_id')::uuid;
    v_quantity := (item->>'quantity')::integer;
    
    -- Get current stock
    SELECT stock_quantity INTO v_available
    FROM products WHERE id = v_product_id FOR UPDATE;
    
    IF v_available IS NULL THEN
      RAISE EXCEPTION 'Produto não encontrado: %', v_product_id;
    END IF;
    
    -- Calculate already reserved stock (active reservations)
    SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
    FROM stock_reservations
    WHERE product_id = v_product_id 
      AND status = 'reserved'
      AND expires_at > now();
    
    IF (v_available - v_reserved) < v_quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente para produto %. Disponível: %, Reservado: %, Solicitado: %', 
        v_product_id, v_available, v_reserved, v_quantity;
    END IF;
  END LOOP;
  
  -- All validated, now create reservations
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'product_id')::uuid;
    v_quantity := (item->>'quantity')::integer;
    
    INSERT INTO stock_reservations (order_id, product_id, quantity)
    VALUES (p_order_id, v_product_id, v_quantity);
    
    v_result := v_result || jsonb_build_object('product_id', v_product_id, 'reserved', v_quantity);
  END LOOP;
  
  RETURN jsonb_build_object('ok', true, 'reservations', v_result);
END;
$$;

-- 3. Função para confirmar reserva (após pagamento aprovado)
CREATE OR REPLACE FUNCTION public.confirm_stock_reservation(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
  v_count integer := 0;
BEGIN
  FOR r IN 
    SELECT * FROM stock_reservations 
    WHERE order_id = p_order_id AND status = 'reserved'
    FOR UPDATE
  LOOP
    -- Decrease actual stock
    UPDATE products 
    SET stock_quantity = stock_quantity - r.quantity,
        updated_at = now()
    WHERE id = r.product_id AND stock_quantity >= r.quantity;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Falha ao confirmar estoque para produto %', r.product_id;
    END IF;
    
    -- Mark reservation as confirmed
    UPDATE stock_reservations
    SET status = 'confirmed', confirmed_at = now()
    WHERE id = r.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object('ok', true, 'confirmed', v_count);
END;
$$;

-- 4. Função para liberar reservas expiradas
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE stock_reservations
  SET status = 'expired', released_at = now()
  WHERE status = 'reserved' AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 5. Função para liberar reserva manualmente (cancelamento)
CREATE OR REPLACE FUNCTION public.release_stock_reservation(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
  v_count integer := 0;
BEGIN
  FOR r IN 
    SELECT * FROM stock_reservations 
    WHERE order_id = p_order_id AND status IN ('reserved', 'confirmed')
    FOR UPDATE
  LOOP
    -- If was confirmed, restore stock
    IF r.status = 'confirmed' THEN
      UPDATE products 
      SET stock_quantity = stock_quantity + r.quantity,
          updated_at = now()
      WHERE id = r.product_id;
    END IF;
    
    UPDATE stock_reservations
    SET status = 'released', released_at = now()
    WHERE id = r.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object('ok', true, 'released', v_count);
END;
$$;

-- 6. Função helper para estoque disponível real (stock - reservas ativas)
CREATE OR REPLACE FUNCTION public.get_available_stock(p_product_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT GREATEST(0, 
    (SELECT stock_quantity FROM products WHERE id = p_product_id)
    - COALESCE((
      SELECT SUM(quantity) FROM stock_reservations
      WHERE product_id = p_product_id AND status = 'reserved' AND expires_at > now()
    ), 0)
  )::integer;
$$;
