
-- Add extra fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf_cnpj text DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS neighborhood text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_complement text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- Enable realtime for cart_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;

-- Allow admins to delete profiles
CREATE POLICY "Admins can manage profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
