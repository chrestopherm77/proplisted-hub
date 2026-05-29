ALTER TABLE public.rental_partners
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS commission_tenant_text text,
  ADD COLUMN IF NOT EXISTS commission_tenant_when text,
  ADD COLUMN IF NOT EXISTS commission_owner_text text,
  ADD COLUMN IF NOT EXISTS commission_owner_when text,
  ADD COLUMN IF NOT EXISTS service_areas jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.rental_partners
  SET service_areas = jsonb_build_array(jsonb_build_object('state', state, 'city', city))
  WHERE jsonb_array_length(COALESCE(service_areas, '[]'::jsonb)) = 0;