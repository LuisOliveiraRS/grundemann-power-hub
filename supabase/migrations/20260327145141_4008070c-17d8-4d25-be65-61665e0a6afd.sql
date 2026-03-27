CREATE TABLE public.hero_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_backgrounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage hero_backgrounds" ON public.hero_backgrounds
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can view active hero_backgrounds" ON public.hero_backgrounds
  FOR SELECT TO public USING (is_active = true OR is_admin());

INSERT INTO public.hero_backgrounds (image_url, display_order) VALUES
  ('https://hodtsmyjqtkjlkburoea.supabase.co/storage/v1/object/public/hero-banners/hero-bg-engine-1.jpg', 0),
  ('https://hodtsmyjqtkjlkburoea.supabase.co/storage/v1/object/public/hero-banners/hero-bg-engine-2.jpg', 1),
  ('https://hodtsmyjqtkjlkburoea.supabase.co/storage/v1/object/public/hero-banners/hero-bg-engine-3.jpg', 2);