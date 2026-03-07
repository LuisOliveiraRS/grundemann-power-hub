
-- Add 'seller' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';

-- Create sellers table with commission info
CREATE TABLE public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  commission_rate numeric NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  total_sales numeric NOT NULL DEFAULT 0,
  total_commission numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sellers" ON public.sellers FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Sellers can view own data" ON public.sellers FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Create sale_commissions table
CREATE TABLE public.sale_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  order_total numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commissions" ON public.sale_commissions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Sellers can view own commissions" ON public.sale_commissions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sellers WHERE sellers.id = sale_commissions.seller_id AND sellers.user_id = auth.uid())
);

-- Add seller_id to orders table for tracking which seller made the sale
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.sellers(id);

-- Add product extra fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hp text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS engine_model text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS documents text[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_title text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_description text DEFAULT '';

-- Allow admins to delete order_items and order_status_history (needed for order deletion)
CREATE POLICY "Admins can delete order items" ON public.order_items FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admins can delete status history" ON public.order_status_history FOR DELETE TO authenticated USING (is_admin());
