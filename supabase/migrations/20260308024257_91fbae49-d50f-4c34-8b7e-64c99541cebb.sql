
-- Fix quotes: drop all RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;

CREATE POLICY "Admins can manage quotes" ON public.quotes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can insert quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR is_admin());

-- Fix quote_items: drop all RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Anyone can add quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can view own quote items" ON public.quote_items;

CREATE POLICY "Admins can manage quote items" ON public.quote_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Users can insert quote items" ON public.quote_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid())
);
CREATE POLICY "Users can view own quote items" ON public.quote_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND (quotes.user_id = auth.uid() OR is_admin()))
);

-- Fix favorites: same RESTRICTIVE issue
DROP POLICY IF EXISTS "Admins can manage favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;

CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR is_admin());
