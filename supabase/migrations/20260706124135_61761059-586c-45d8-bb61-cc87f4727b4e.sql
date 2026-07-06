
CREATE POLICY "Public read event covers" ON storage.objects FOR SELECT USING (bucket_id = 'event-covers');
CREATE POLICY "Admins insert event covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-covers' AND has_role(auth.uid(), 'MASTER_ADMIN'::app_role));
CREATE POLICY "Admins update event covers" ON storage.objects FOR UPDATE USING (bucket_id = 'event-covers' AND has_role(auth.uid(), 'MASTER_ADMIN'::app_role));
CREATE POLICY "Admins delete event covers" ON storage.objects FOR DELETE USING (bucket_id = 'event-covers' AND has_role(auth.uid(), 'MASTER_ADMIN'::app_role));
