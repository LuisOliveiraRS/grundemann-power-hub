
-- Marketing campaigns
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'promotion',
  status text NOT NULL DEFAULT 'draft',
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  product_ids uuid[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns" ON public.marketing_campaigns
  AS PERMISSIVE FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Marketing creatives (generated images/arts)
CREATE TABLE public.marketing_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  title text NOT NULL,
  format text NOT NULL DEFAULT 'post_instagram',
  image_url text,
  headline text,
  body_text text,
  hashtags text,
  cta text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage creatives" ON public.marketing_creatives
  AS PERMISSIVE FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Marketing posts (scheduled/published)
CREATE TABLE public.marketing_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id uuid REFERENCES public.marketing_creatives(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  platform text NOT NULL DEFAULT 'instagram',
  scheduled_at timestamp with time zone,
  published_at timestamp with time zone,
  status text NOT NULL DEFAULT 'scheduled',
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage posts" ON public.marketing_posts
  AS PERMISSIVE FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
