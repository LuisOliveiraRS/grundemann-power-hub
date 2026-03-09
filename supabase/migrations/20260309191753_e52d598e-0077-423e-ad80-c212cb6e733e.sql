
-- Create technical_catalogs table
CREATE TABLE public.technical_catalogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Geral',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technical_catalogs ENABLE ROW LEVEL SECURITY;

-- Admins can manage catalogs
CREATE POLICY "Admins can manage catalogs" ON public.technical_catalogs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Authenticated mechanics can view active catalogs
CREATE POLICY "Mechanics can view active catalogs" ON public.technical_catalogs
  FOR SELECT TO authenticated
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM public.mechanics WHERE user_id = auth.uid()
    )
  );

-- Create storage bucket for catalog files
INSERT INTO storage.buckets (id, name, public) VALUES ('technical-catalogs', 'technical-catalogs', false);

-- Storage policy: admins can upload
CREATE POLICY "Admins can upload catalogs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'technical-catalogs' AND public.is_admin());

-- Storage policy: admins can delete
CREATE POLICY "Admins can delete catalogs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'technical-catalogs' AND public.is_admin());

-- Storage policy: admins can update
CREATE POLICY "Admins can update catalogs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'technical-catalogs' AND public.is_admin());

-- Storage policy: authenticated mechanics can read
CREATE POLICY "Mechanics can read catalogs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'technical-catalogs' 
    AND (
      public.is_admin() 
      OR EXISTS (SELECT 1 FROM public.mechanics WHERE user_id = auth.uid())
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_technical_catalogs_updated_at
  BEFORE UPDATE ON public.technical_catalogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
