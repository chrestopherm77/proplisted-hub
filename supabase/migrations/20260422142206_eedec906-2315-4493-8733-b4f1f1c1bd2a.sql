-- Storage policies for brand-logos bucket
CREATE POLICY "Public can view brand logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

CREATE POLICY "Users can upload own brand logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own brand logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own brand logo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);