ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS feedback_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS feedback_response text,
  ADD COLUMN IF NOT EXISTS feedback_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS feedback_attempts integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_leads_feedback_pending
  ON public.leads (created_at, feedback_sent_at)
  WHERE is_active = true AND whatsapp_confirmed = true AND is_exhausted = false;