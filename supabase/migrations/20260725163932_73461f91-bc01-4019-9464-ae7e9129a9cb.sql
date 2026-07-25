CREATE TABLE public.lead_feedback_queue (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  scheduled_at timestamptz not null default now(),
  status text not null default 'PENDING',
  sent_at timestamptz,
  error text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE UNIQUE INDEX lead_feedback_queue_lead_pending_idx ON public.lead_feedback_queue(lead_id) WHERE status = 'PENDING';
CREATE INDEX lead_feedback_queue_due_idx ON public.lead_feedback_queue(status, scheduled_at);

GRANT SELECT ON public.lead_feedback_queue TO authenticated;
GRANT ALL ON public.lead_feedback_queue TO service_role;

ALTER TABLE public.lead_feedback_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view feedback queue" ON public.lead_feedback_queue
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE TRIGGER update_lead_feedback_queue_updated_at
BEFORE UPDATE ON public.lead_feedback_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();