
CREATE TABLE public.hero_headlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_headlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage hero_headlines" ON public.hero_headlines
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can view active hero_headlines" ON public.hero_headlines
  FOR SELECT TO public USING (is_active = true OR is_admin());

-- Seed default headlines
INSERT INTO public.hero_headlines (title, subtitle, display_order) VALUES
  ('Potência e\nconfiabilidade', 'Peças e motores estacionários com qualidade profissional', 0),
  ('Soluções que\ngeram resultados', 'Confiança e parceria para o crescimento do seu negócio', 1),
  ('Força e\ndurabilidade', 'Filtros, carburadores e assistência técnica especializada', 2);
