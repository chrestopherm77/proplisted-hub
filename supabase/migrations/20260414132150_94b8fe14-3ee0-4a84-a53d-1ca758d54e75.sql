
-- Add expiry date column to launches
ALTER TABLE public.launches ADD COLUMN table_expires_at date;

-- Create launch_alerts table
CREATE TABLE public.launch_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.launch_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own launch alerts" ON public.launch_alerts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all launch alerts" ON public.launch_alerts
  FOR SELECT TO public
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Enable pg_cron and pg_net for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
