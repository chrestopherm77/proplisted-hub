ALTER TABLE public.property_searches
ADD COLUMN IF NOT EXISTS condominium TEXT,
ADD COLUMN IF NOT EXISTS floor TEXT;