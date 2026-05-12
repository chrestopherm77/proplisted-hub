
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accepted_contract boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_dpa boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_terms_of_use boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
