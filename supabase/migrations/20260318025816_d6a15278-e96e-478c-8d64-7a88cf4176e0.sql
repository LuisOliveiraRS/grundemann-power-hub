
-- Table for reseller-uploaded files (needs admin approval)
CREATE TABLE public.reseller_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Outros',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT DEFAULT '',
  catalog_id UUID REFERENCES public.technical_catalogs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_files ENABLE ROW LEVEL SECURITY;

-- Resellers can manage their own files
CREATE POLICY "reseller_files_user_select" ON public.reseller_files
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "reseller_files_user_insert" ON public.reseller_files
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "reseller_files_user_update" ON public.reseller_files
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "reseller_files_user_delete" ON public.reseller_files
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Admin full access
CREATE POLICY "reseller_files_admin_all" ON public.reseller_files
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add reseller pricing columns to product_resellers
ALTER TABLE public.product_resellers
  ADD COLUMN IF NOT EXISTS reseller_price NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS store_commission_pct NUMERIC DEFAULT NULL;
