ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.creatives REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creatives;