
-- Discount coupons table
CREATE TABLE public.discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'fixed',
  discount_value numeric NOT NULL DEFAULT 0,
  is_used boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  reward_redemption_id uuid REFERENCES public.reward_redemptions(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coupons" ON public.discount_coupons FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage coupons" ON public.discount_coupons FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Function to generate coupon on reward redemption approval
CREATE OR REPLACE FUNCTION public.generate_coupon_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward rewards%ROWTYPE;
  v_code text;
BEGIN
  -- Only when status changes to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    SELECT * INTO v_reward FROM public.rewards WHERE id = NEW.reward_id;
    
    IF v_reward.id IS NOT NULL THEN
      -- Generate unique code
      v_code := 'GRD-' || UPPER(SUBSTR(MD5(gen_random_uuid()::text), 1, 8));
      
      INSERT INTO public.discount_coupons (user_id, code, discount_type, discount_value, reward_redemption_id, expires_at)
      VALUES (
        NEW.user_id,
        v_code,
        CASE WHEN v_reward.reward_type = 'percentage' THEN 'percentage'
             WHEN v_reward.reward_type = 'freeShipping' THEN 'freeShipping'
             ELSE 'fixed'
        END,
        v_reward.reward_value,
        NEW.id,
        NOW() + INTERVAL '30 days'
      );

      -- Notify user about the coupon
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        'Cupom gerado! 🎟️',
        'Seu cupom ' || v_code || ' foi gerado! Use no checkout. Válido por 30 dias.',
        'reward',
        '/checkout'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_coupon_on_approval
  AFTER UPDATE ON public.reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_coupon_on_approval();
