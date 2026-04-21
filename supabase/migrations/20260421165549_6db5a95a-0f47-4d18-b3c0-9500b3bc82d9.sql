-- Update CRM stage check constraint to support new pipeline stages
ALTER TABLE public.lead_crm_status DROP CONSTRAINT IF EXISTS lead_crm_status_stage_check;

-- Migrate existing rows from old stages to new stages
UPDATE public.lead_crm_status SET stage = 'ENTRADA' WHERE stage = 'NOVO';
UPDATE public.lead_crm_status SET stage = 'EM_ATENDIMENTO' WHERE stage = 'EM_CONVERSA';
UPDATE public.lead_crm_status SET stage = 'VISITA' WHERE stage = 'AGENDADO';
UPDATE public.lead_crm_status SET stage = 'GANHO' WHERE stage = 'VENDIDO';
-- 'PERDIDO' stays the same

-- Add new constraint with current pipeline stages
ALTER TABLE public.lead_crm_status
  ADD CONSTRAINT lead_crm_status_stage_check
  CHECK (stage = ANY (ARRAY['ENTRADA'::text, 'EM_ATENDIMENTO'::text, 'VISITA'::text, 'NEGOCIACAO'::text, 'ASSINATURA'::text, 'GANHO'::text, 'PERDIDO'::text]));

-- Update default to match new pipeline
ALTER TABLE public.lead_crm_status ALTER COLUMN stage SET DEFAULT 'ENTRADA';