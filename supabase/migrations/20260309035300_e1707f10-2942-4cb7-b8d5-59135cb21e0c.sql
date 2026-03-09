
CREATE TABLE public.price_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  competitor_name text NOT NULL,
  competitor_url text,
  competitor_price numeric,
  our_price numeric NOT NULL,
  price_difference numeric,
  price_difference_pct numeric,
  suggested_price numeric,
  ai_analysis text,
  search_query text,
  raw_results jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.price_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage price research"
  ON public.price_research FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
