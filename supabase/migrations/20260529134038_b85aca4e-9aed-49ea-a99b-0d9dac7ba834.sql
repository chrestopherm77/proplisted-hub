CREATE POLICY "Admins manage brand-logos" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'brand-logos' AND public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
WITH CHECK (bucket_id = 'brand-logos' AND public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role));