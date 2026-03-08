
CREATE TABLE public.email_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  discount_code TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.email_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view subscribers" ON public.email_subscribers
  FOR SELECT USING (public.is_admin());

CREATE UNIQUE INDEX idx_email_subscribers_email ON public.email_subscribers(email);
