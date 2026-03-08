
-- Fix RLS policies for quotes - change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;

CREATE POLICY "Admins can manage quotes" ON public.quotes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can create quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR is_admin());

-- Fix RLS policies for quote_items
DROP POLICY IF EXISTS "Admins can manage quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Anyone can add quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can view own quote items" ON public.quote_items;

CREATE POLICY "Admins can manage quote items" ON public.quote_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can add quote items" ON public.quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view own quote items" ON public.quote_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND (quotes.user_id = auth.uid() OR is_admin()))
);

-- Create AI conversation logs table
CREATE TABLE IF NOT EXISTS public.ai_conversation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_question text NOT NULL,
  ai_response text,
  problem_identified text,
  products_suggested jsonb DEFAULT '[]'::jsonb,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert logs" ON public.ai_conversation_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view logs" ON public.ai_conversation_logs FOR SELECT TO authenticated USING (is_admin());
