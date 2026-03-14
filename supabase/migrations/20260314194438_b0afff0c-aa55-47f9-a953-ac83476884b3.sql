CREATE POLICY "Anyone can view active catalogs"
ON public.technical_catalogs
FOR SELECT
TO public
USING (is_active = true);