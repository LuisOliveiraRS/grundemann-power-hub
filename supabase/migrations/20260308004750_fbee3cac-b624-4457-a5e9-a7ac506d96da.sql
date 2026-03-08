
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage favorites" ON public.favorites FOR ALL USING (is_admin()) WITH CHECK (is_admin());
