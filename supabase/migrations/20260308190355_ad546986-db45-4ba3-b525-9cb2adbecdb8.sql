
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  title text,
  comment text NOT NULL,
  is_verified_purchase boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews" ON public.product_reviews
  FOR SELECT USING (is_approved = true OR is_admin());

CREATE POLICY "Authenticated users can submit reviews" ON public.product_reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage reviews" ON public.product_reviews
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE UNIQUE INDEX unique_user_product_review ON public.product_reviews (user_id, product_id);
