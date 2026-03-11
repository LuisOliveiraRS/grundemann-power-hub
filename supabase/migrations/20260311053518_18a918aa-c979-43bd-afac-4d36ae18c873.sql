CREATE TABLE public.exploded_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  engine_type text NOT NULL DEFAULT 'gasolina',
  section_label text NOT NULL DEFAULT '',
  section_name text NOT NULL,
  search_term text DEFAULT '',
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.exploded_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage exploded views" ON public.exploded_views
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can view active exploded views" ON public.exploded_views
  FOR SELECT TO public
  USING (is_active = true OR is_admin());