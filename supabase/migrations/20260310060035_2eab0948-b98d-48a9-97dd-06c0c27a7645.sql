
-- Add free_shipping flag to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false;

-- Add video_urls column to mechanic area (for admin to add videos visible to mechanics)
CREATE TABLE IF NOT EXISTS public.mechanic_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  video_url text NOT NULL,
  category text NOT NULL DEFAULT 'Geral',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mechanic_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mechanic videos" ON public.mechanic_videos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Mechanics can view active videos" ON public.mechanic_videos
  FOR SELECT TO authenticated
  USING (is_active = true AND EXISTS (SELECT 1 FROM public.mechanics WHERE mechanics.user_id = auth.uid()));
