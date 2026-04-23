ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS pending_downgrade_to_plan_id uuid REFERENCES public.subscription_plans(id),
  ADD COLUMN IF NOT EXISTS scheduled_change_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_scheduled_change
  ON public.user_subscriptions(scheduled_change_at)
  WHERE scheduled_change_at IS NOT NULL;