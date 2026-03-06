
-- Add recovery columns to lp_partial_leads
ALTER TABLE public.lp_partial_leads 
  ADD COLUMN IF NOT EXISTS recovery_sent_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_lp text DEFAULT NULL;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
