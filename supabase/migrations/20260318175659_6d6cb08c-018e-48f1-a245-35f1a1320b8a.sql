
-- Create storage bucket for hero banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-banners', 'hero-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to hero-banners
CREATE POLICY "Anyone can view hero banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hero-banners');

-- Allow admins to upload/manage hero banners
CREATE POLICY "Admins can upload hero banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hero-banners' AND public.is_admin());

CREATE POLICY "Admins can update hero banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'hero-banners' AND public.is_admin());

CREATE POLICY "Admins can delete hero banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hero-banners' AND public.is_admin());
