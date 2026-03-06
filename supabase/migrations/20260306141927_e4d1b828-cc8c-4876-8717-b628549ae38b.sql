
-- Add tracking_code to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_code text DEFAULT '';

-- Create testimonials table
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_city text DEFAULT '',
  rating integer NOT NULL DEFAULT 5,
  comment text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved testimonials
CREATE POLICY "Anyone can view approved testimonials" ON public.testimonials
  FOR SELECT USING (is_approved = true OR is_admin());

-- Authenticated users can insert testimonials
CREATE POLICY "Authenticated users can submit testimonials" ON public.testimonials
  FOR INSERT TO authenticated WITH CHECK (true);

-- Admins can manage all testimonials
CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
