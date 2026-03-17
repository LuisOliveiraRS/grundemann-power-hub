
-- Table to track diagnostic searches for analytics
CREATE TABLE IF NOT EXISTS public.diagnostic_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid REFERENCES public.diagnostic_problems(id) ON DELETE SET NULL,
  problem_slug text NOT NULL,
  model_search text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diagnostic_search_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous tracking)
CREATE POLICY "Anyone can log diagnostic searches"
  ON public.diagnostic_search_logs FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view diagnostic logs"
  ON public.diagnostic_search_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Table to track model searches
CREATE TABLE IF NOT EXISTS public.model_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES public.generator_models(id) ON DELETE SET NULL,
  model_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.model_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log model searches"
  ON public.model_search_logs FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view model logs"
  ON public.model_search_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Add problem_id and model_id columns to technical_articles for linking
ALTER TABLE public.technical_articles
  ADD COLUMN IF NOT EXISTS problem_id uuid REFERENCES public.diagnostic_problems(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS model_id uuid REFERENCES public.generator_models(id) ON DELETE SET NULL;
