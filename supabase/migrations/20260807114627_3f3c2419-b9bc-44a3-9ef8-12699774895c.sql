ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS pix_auto_authorization_id text,
  ADD COLUMN IF NOT EXISTS pix_auto_status text;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_pix_auto_auth
  ON public.user_subscriptions (pix_auto_authorization_id);