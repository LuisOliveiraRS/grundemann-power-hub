-- Allow resellers (mechanics) to upload files to technical-catalogs bucket
CREATE POLICY "Resellers can upload to technical-catalogs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'technical-catalogs'
  AND EXISTS (SELECT 1 FROM public.mechanics WHERE user_id = auth.uid())
);

-- Allow resellers to delete their own uploaded files
CREATE POLICY "Resellers can delete own files from technical-catalogs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'technical-catalogs'
  AND EXISTS (SELECT 1 FROM public.mechanics WHERE user_id = auth.uid())
  AND (storage.foldername(name))[1] IS NOT NULL
);