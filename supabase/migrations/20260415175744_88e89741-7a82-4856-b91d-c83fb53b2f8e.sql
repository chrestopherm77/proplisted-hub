CREATE TABLE public.lead_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lead_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lead alerts"
  ON public.lead_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all lead alerts"
  ON public.lead_alerts FOR SELECT TO public
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));