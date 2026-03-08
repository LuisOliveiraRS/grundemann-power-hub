
-- Shipping rates table for admin management
CREATE TABLE public.shipping_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_code TEXT NOT NULL UNIQUE,
  region_label TEXT NOT NULL,
  pac_price NUMERIC NOT NULL DEFAULT 0,
  pac_days TEXT NOT NULL DEFAULT '5-10',
  sedex_price NUMERIC NOT NULL DEFAULT 0,
  sedex_days TEXT NOT NULL DEFAULT '2-5',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shipping rates"
ON public.shipping_rates FOR SELECT
USING (true);

CREATE POLICY "Admins can manage shipping rates"
ON public.shipping_rates FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Insert default rates
INSERT INTO public.shipping_rates (region_code, region_label, pac_price, pac_days, sedex_price, sedex_days) VALUES
('RS', 'Rio Grande do Sul', 18.90, '3-5', 32.90, '1-2'),
('SC', 'Santa Catarina', 22.90, '3-6', 38.90, '1-3'),
('PR', 'Paraná', 25.90, '4-7', 42.90, '2-3'),
('SP_CAPITAL', 'São Paulo - Capital', 32.90, '5-8', 52.90, '2-4'),
('SP_INTERIOR', 'São Paulo - Interior', 34.90, '5-9', 54.90, '2-4'),
('RJ', 'Rio de Janeiro', 35.90, '6-10', 56.90, '3-5'),
('MG', 'Minas Gerais', 34.90, '5-9', 54.90, '3-5'),
('ES', 'Espírito Santo', 36.90, '6-10', 58.90, '3-5'),
('MS', 'Mato Grosso do Sul', 32.90, '5-8', 52.90, '2-4'),
('MT', 'Mato Grosso', 38.90, '6-10', 62.90, '3-5'),
('GO_DF', 'Goiás / DF', 36.90, '6-10', 58.90, '3-5'),
('TO', 'Tocantins', 42.90, '7-12', 68.90, '4-6'),
('BA', 'Bahia', 42.90, '7-12', 68.90, '4-6'),
('SE', 'Sergipe', 44.90, '8-13', 72.90, '4-7'),
('AL', 'Alagoas', 44.90, '8-13', 72.90, '4-7'),
('PE', 'Pernambuco', 44.90, '8-13', 72.90, '4-7'),
('PB', 'Paraíba', 46.90, '8-14', 74.90, '5-7'),
('RN', 'Rio Grande do Norte', 46.90, '8-14', 74.90, '5-7'),
('CE', 'Ceará', 48.90, '9-15', 78.90, '5-8'),
('PI', 'Piauí', 48.90, '9-15', 78.90, '5-8'),
('MA', 'Maranhão', 52.90, '10-16', 84.90, '5-8'),
('PA', 'Pará', 54.90, '10-18', 88.90, '6-9'),
('AP', 'Amapá', 58.90, '12-20', 94.90, '7-10'),
('AM', 'Amazonas', 62.90, '12-22', 98.90, '7-12'),
('RR', 'Roraima', 64.90, '14-25', 102.90, '8-12'),
('AC', 'Acre', 64.90, '14-25', 102.90, '8-12');

-- Full-text search for technical articles
ALTER TABLE public.technical_articles ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.update_article_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.search_vector := to_tsvector('portuguese', coalesce(NEW.title, '') || ' ' || coalesce(NEW.excerpt, '') || ' ' || coalesce(NEW.content, '') || ' ' || coalesce(array_to_string(NEW.tags, ' '), ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_article_search_vector
BEFORE INSERT OR UPDATE ON public.technical_articles
FOR EACH ROW EXECUTE FUNCTION public.update_article_search_vector();

-- Update existing articles
UPDATE public.technical_articles SET updated_at = now();

CREATE INDEX idx_articles_search ON public.technical_articles USING gin(search_vector);

-- Full-text search function
CREATE OR REPLACE FUNCTION public.search_articles(search_query TEXT)
RETURNS SETOF public.technical_articles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT * FROM public.technical_articles
  WHERE is_published = true
    AND (search_vector @@ plainto_tsquery('portuguese', search_query)
      OR title ILIKE '%' || search_query || '%'
      OR excerpt ILIKE '%' || search_query || '%')
  ORDER BY ts_rank(search_vector, plainto_tsquery('portuguese', search_query)) DESC
  LIMIT 50;
$$;
