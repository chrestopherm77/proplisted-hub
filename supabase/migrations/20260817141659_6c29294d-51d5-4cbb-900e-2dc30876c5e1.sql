CREATE TABLE public.lead_feedback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('OUT','IN')),
  name text,
  phone text NOT NULL,
  intention text,
  status text,
  ok boolean NOT NULL DEFAULT true,
  detail text,
  lead_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lead_feedback_events TO authenticated;
GRANT ALL ON public.lead_feedback_events TO service_role;
ALTER TABLE public.lead_feedback_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view feedback events" ON public.lead_feedback_events
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));
CREATE INDEX idx_lead_feedback_events_created ON public.lead_feedback_events (created_at DESC);