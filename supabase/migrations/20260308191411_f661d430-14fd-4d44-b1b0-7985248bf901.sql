
-- Loyalty points table
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'earn',
  description text NOT NULL DEFAULT '',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rewards table
CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_required integer NOT NULL DEFAULT 100,
  reward_type text NOT NULL DEFAULT 'discount',
  reward_value numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Redeemed rewards
CREATE TABLE public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_id uuid REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
  points_spent integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Loyalty points policies
CREATE POLICY "Users can view own points" ON public.loyalty_points FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage points" ON public.loyalty_points FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Rewards policies (public read)
CREATE POLICY "Anyone can view active rewards" ON public.rewards FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins can manage rewards" ON public.rewards FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Redemptions policies
CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can redeem rewards" ON public.reward_redemptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage redemptions" ON public.reward_redemptions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to calculate user total points
CREATE OR REPLACE FUNCTION public.get_user_points(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE WHEN type = 'earn' THEN points
         WHEN type = 'redeem' THEN -points
         ELSE 0
    END
  ), 0)::integer
  FROM public.loyalty_points
  WHERE user_id = p_user_id
$$;
