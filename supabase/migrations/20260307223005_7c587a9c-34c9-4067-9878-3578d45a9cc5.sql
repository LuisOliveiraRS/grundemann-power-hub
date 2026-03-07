
-- Quotes/Budget request system
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  customer_company text DEFAULT '',
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  total_estimated numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Anyone can create quotes (even unauthenticated via edge function, but also authenticated)
CREATE POLICY "Anyone can create quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Admins can manage quotes" ON public.quotes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can add quote items" ON public.quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view own quote items" ON public.quote_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_items.quote_id AND (quotes.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "Admins can manage quote items" ON public.quote_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
