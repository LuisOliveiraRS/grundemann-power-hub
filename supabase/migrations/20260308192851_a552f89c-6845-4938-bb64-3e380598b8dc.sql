
-- Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  referral_code text NOT NULL,
  referrer_points_credited boolean NOT NULL DEFAULT false,
  referred_points_credited boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- System inserts referrals (via trigger), admins can manage
CREATE POLICY "Admins can manage referrals" ON public.referrals
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Add referral_code column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'GRD-' || UPPER(SUBSTR(MD5(NEW.user_id::text || now()::text), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Update existing profiles with referral codes
UPDATE public.profiles 
SET referral_code = 'GRD-' || UPPER(SUBSTR(MD5(user_id::text || created_at::text), 1, 6))
WHERE referral_code IS NULL;

-- Function to process referral on signup
CREATE OR REPLACE FUNCTION public.process_referral(p_referred_id uuid, p_referral_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referrer_points integer := 100;
  v_referred_points integer := 50;
BEGIN
  -- Find referrer by code
  SELECT user_id INTO v_referrer_id FROM public.profiles WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL OR v_referrer_id = p_referred_id THEN
    RETURN false;
  END IF;

  -- Check if already referred
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_referred_id) THEN
    RETURN false;
  END IF;

  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, referrer_points_credited, referred_points_credited)
  VALUES (v_referrer_id, p_referred_id, p_referral_code, true, true);

  -- Credit referrer points
  INSERT INTO public.loyalty_points (user_id, points, type, description)
  VALUES (v_referrer_id, v_referrer_points, 'earn', 'Bônus por indicação de amigo');

  -- Credit referred points
  INSERT INTO public.loyalty_points (user_id, points, type, description)
  VALUES (p_referred_id, v_referred_points, 'earn', 'Bônus de boas-vindas por indicação');

  -- Notify referrer
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (v_referrer_id, 'Indicação bem-sucedida! 🎉', 'Seu amigo se cadastrou! Você ganhou ' || v_referrer_points || ' pontos.', 'points', '/minha-conta');

  -- Notify referred
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_referred_id, 'Bem-vindo! 🎁', 'Você ganhou ' || v_referred_points || ' pontos de boas-vindas por indicação!', 'points', '/minha-conta');

  RETURN true;
END;
$$;
