
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses_per_user integer DEFAULT 1;

ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS max_uses_per_user integer DEFAULT 1;
