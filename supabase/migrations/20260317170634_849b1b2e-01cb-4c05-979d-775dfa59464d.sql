
-- Diagnostic Problems table
CREATE TABLE public.diagnostic_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon_name text DEFAULT 'AlertTriangle',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.diagnostic_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active problems" ON public.diagnostic_problems
  FOR SELECT TO public USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage problems" ON public.diagnostic_problems
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Diagnostic Causes table
CREATE TABLE public.diagnostic_causes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES public.diagnostic_problems(id) ON DELETE CASCADE,
  cause_text text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.diagnostic_causes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view causes" ON public.diagnostic_causes
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage causes" ON public.diagnostic_causes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Diagnostic Product Tags
CREATE TABLE public.diagnostic_product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES public.diagnostic_problems(id) ON DELETE CASCADE,
  search_tag text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.diagnostic_product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product tags" ON public.diagnostic_product_tags
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage product tags" ON public.diagnostic_product_tags
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Maintenance Kits table
CREATE TABLE public.maintenance_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  kit_type text NOT NULL DEFAULT 'basic',
  problem_id uuid REFERENCES public.diagnostic_problems(id) ON DELETE SET NULL,
  model_id uuid REFERENCES public.generator_models(id) ON DELETE SET NULL,
  discount_pct numeric DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.maintenance_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active kits" ON public.maintenance_kits
  FOR SELECT TO public USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage kits" ON public.maintenance_kits
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Kit Items table
CREATE TABLE public.kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES public.maintenance_kits(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view kit items" ON public.kit_items
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage kit items" ON public.kit_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed the 7 diagnostic problems
INSERT INTO public.diagnostic_problems (name, slug, description, icon_name, display_order) VALUES
  ('Gerador não liga', 'gerador-nao-liga', 'O gerador não dá partida ou não responde ao acionamento.', 'Power', 1),
  ('Gerador liga e desliga', 'gerador-liga-e-desliga', 'O gerador funciona por alguns segundos e depois para.', 'RefreshCw', 2),
  ('Gerador sem energia', 'gerador-sem-energia', 'O motor funciona mas não há saída de energia elétrica.', 'Zap', 3),
  ('Gerador falhando', 'gerador-falhando', 'O motor engasga, falha ou funciona de forma irregular.', 'AlertTriangle', 4),
  ('Gerador com baixa potência', 'gerador-com-baixa-potencia', 'O gerador funciona mas não sustenta a carga ou perde força.', 'TrendingDown', 5),
  ('Gerador com consumo alto', 'gerador-com-consumo-alto', 'Consumo excessivo de combustível durante a operação.', 'Fuel', 6),
  ('Gerador com ruído anormal', 'gerador-com-ruido-anormal', 'Barulhos estranhos, vibração excessiva ou batidas no motor.', 'Volume2', 7);

ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_problems;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_kits;
