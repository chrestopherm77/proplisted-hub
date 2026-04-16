ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS confirmation_whatsapp_status text,
  ADD COLUMN IF NOT EXISTS confirmation_whatsapp_error text,
  ADD COLUMN IF NOT EXISTS confirmation_whatsapp_message_id text,
  ADD COLUMN IF NOT EXISTS confirmation_whatsapp_sent_at timestamptz;