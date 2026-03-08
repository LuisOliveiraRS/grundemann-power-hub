
-- Trigger to auto-credit loyalty points when order status changes to 'delivered'
CREATE OR REPLACE FUNCTION public.credit_loyalty_points_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Check if points were already credited for this order
    IF NOT EXISTS (
      SELECT 1 FROM public.loyalty_points
      WHERE order_id = NEW.id AND user_id = NEW.user_id AND type = 'earn'
    ) THEN
      -- Credit 1 point per R$1 spent
      INSERT INTO public.loyalty_points (user_id, points, type, description, order_id)
      VALUES (
        NEW.user_id,
        GREATEST(1, FLOOR(NEW.total_amount)::integer),
        'earn',
        'Pontos por compra - Pedido #' || LEFT(NEW.id::text, 8),
        NEW.id
      );

      -- Also create a notification
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        'Pontos creditados! ⭐',
        'Você ganhou ' || GREATEST(1, FLOOR(NEW.total_amount)::integer) || ' pontos pela entrega do pedido #' || LEFT(NEW.id::text, 8),
        'points',
        '/minha-conta'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_credit_loyalty_points
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.credit_loyalty_points_on_delivery();
