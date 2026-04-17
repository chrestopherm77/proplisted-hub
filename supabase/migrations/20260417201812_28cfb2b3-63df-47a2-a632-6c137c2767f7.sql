CREATE TABLE public.lead_crm_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  purchase_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  stage text NOT NULL DEFAULT 'NOVO' CHECK (stage IN ('NOVO','EM_CONVERSA','AGENDADO','VENDIDO','PERDIDO')),
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, purchase_id)
);

CREATE INDEX idx_lead_crm_status_user_stage ON public.lead_crm_status (user_id, stage);

ALTER TABLE public.lead_crm_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own crm status"
  ON public.lead_crm_status
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all crm status"
  ON public.lead_crm_status
  FOR ALL
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE TRIGGER update_lead_crm_status_updated_at
  BEFORE UPDATE ON public.lead_crm_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();