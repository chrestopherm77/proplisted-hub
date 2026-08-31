ALTER TABLE public.land_searches
  ADD COLUMN IF NOT EXISTS payment_methods text[] NOT NULL DEFAULT '{}';