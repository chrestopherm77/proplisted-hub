
CREATE TABLE public.mega_api_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  alert_type text NOT NULL DEFAULT 'send_error',
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_sent_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mega_api_alerts_unresolved_idx ON public.mega_api_alerts (created_at DESC) WHERE resolved_at IS NULL;

GRANT SELECT, UPDATE ON public.mega_api_alerts TO authenticated;
GRANT ALL ON public.mega_api_alerts TO service_role;

ALTER TABLE public.mega_api_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view mega alerts" ON public.mega_api_alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins can update mega alerts" ON public.mega_api_alerts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));
