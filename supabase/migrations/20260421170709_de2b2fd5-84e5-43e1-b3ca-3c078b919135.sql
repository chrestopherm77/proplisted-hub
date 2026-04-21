-- Tabela de alertas administrativos
CREATE TABLE public.admin_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'WARNING',
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT admin_alerts_severity_check CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL'))
);

CREATE INDEX idx_admin_alerts_unread ON public.admin_alerts (created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_admin_alerts_type ON public.admin_alerts (type, created_at DESC);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alerts"
  ON public.admin_alerts FOR SELECT
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE POLICY "Admins can update alerts"
  ON public.admin_alerts FOR UPDATE
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE POLICY "Admins can delete alerts"
  ON public.admin_alerts FOR DELETE
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));