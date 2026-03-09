
-- Fix 1: Set search_path on protect_mechanic_admin_fields
CREATE OR REPLACE FUNCTION public.protect_mechanic_admin_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.is_approved := OLD.is_approved;
    NEW.discount_rate := OLD.discount_rate;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix 2: Set search_path on protect_order_admin_fields
CREATE OR REPLACE FUNCTION public.protect_order_admin_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.total_amount := OLD.total_amount;
    NEW.status := OLD.status;
    NEW.seller_id := OLD.seller_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix 3: Restrict order_items INSERT to enforce price from products table
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()
    )
    AND price_at_purchase > 0
    AND quantity > 0
    AND (
      product_id IS NULL
      OR price_at_purchase = (SELECT p.price FROM public.products p WHERE p.id = product_id)
    )
  );

-- Fix 4: Restrict quotes INSERT to enforce status=pending and no admin_notes
DROP POLICY IF EXISTS "quotes_user_insert" ON public.quotes;
CREATE POLICY "quotes_user_insert" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND (admin_notes IS NULL OR admin_notes = '')
  );
