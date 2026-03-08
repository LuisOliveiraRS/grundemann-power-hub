
-- Add motor compatibility array to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compatible_motors text[] DEFAULT '{}'::text[];

-- Create mechanics table
CREATE TABLE public.mechanics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text DEFAULT '',
  cnpj text DEFAULT '',
  specialty text DEFAULT '',
  discount_rate numeric NOT NULL DEFAULT 5,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.mechanics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mechanics_user_select" ON public.mechanics FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "mechanics_user_insert" ON public.mechanics FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "mechanics_user_update" ON public.mechanics FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "mechanics_admin_all" ON public.mechanics FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
