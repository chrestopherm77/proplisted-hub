ALTER TABLE public.lead_crm_status
  ALTER COLUMN purchase_id DROP NOT NULL,
  ALTER COLUMN lead_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS is_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_name text,
  ADD COLUMN IF NOT EXISTS manual_phone text,
  ADD COLUMN IF NOT EXISTS manual_email text,
  ADD COLUMN IF NOT EXISTS manual_description text;

ALTER TABLE public.lead_crm_status
  ADD CONSTRAINT lead_crm_status_manual_or_purchase_check
  CHECK (
    (is_manual = true AND manual_name IS NOT NULL AND manual_phone IS NOT NULL)
    OR (is_manual = false AND purchase_id IS NOT NULL AND lead_id IS NOT NULL)
  );