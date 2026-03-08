
-- =============================================
-- FIX: All quote/quote_items/favorites policies
-- must be PERMISSIVE (default) so ANY matching 
-- policy allows the operation, not ALL.
-- =============================================

-- QUOTES: Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;

-- QUOTES: Recreate as PERMISSIVE explicitly
CREATE POLICY "quotes_admin_all" ON public.quotes AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "quotes_user_insert" ON public.quotes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quotes_user_select" ON public.quotes AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());

-- QUOTE_ITEMS: Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can insert quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can view own quote items" ON public.quote_items;

-- QUOTE_ITEMS: Recreate as PERMISSIVE explicitly
CREATE POLICY "qi_admin_all" ON public.quote_items AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "qi_user_insert" ON public.quote_items AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid())
);
CREATE POLICY "qi_user_select" ON public.quote_items AS PERMISSIVE FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid())
);

-- FAVORITES: Drop all existing policies
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;

-- FAVORITES: Recreate as PERMISSIVE explicitly
CREATE POLICY "fav_user_insert" ON public.favorites AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "fav_user_delete" ON public.favorites AS PERMISSIVE FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "fav_user_select" ON public.favorites AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
