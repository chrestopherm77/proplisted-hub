ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS last_validated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deactivated_reason text,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

ALTER TABLE public.property_searches
  ADD COLUMN IF NOT EXISTS last_validated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deactivated_reason text,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_properties_pending_validation
  ON public.properties (user_id, last_validated_at)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_property_searches_pending_validation
  ON public.property_searches (user_id, last_validated_at)
  WHERE is_active = true;