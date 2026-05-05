
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS cycle_months integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_slug text;

ALTER TABLE public.subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_billing_cycle_check;
ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_billing_cycle_check
  CHECK (billing_cycle IN ('MONTHLY','QUARTERLY','YEARLY'));

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle text;

-- Marca planos existentes pagos com parent_slug
UPDATE public.subscription_plans
  SET parent_slug = slug, billing_cycle = 'MONTHLY', cycle_months = 1
  WHERE slug IN ('essencial','performance','elite') AND parent_slug IS NULL;

-- Cria as 6 variações (trimestral e anual) herdando features e feature_list
INSERT INTO public.subscription_plans
  (slug, name, price, monthly_credits, display_order, is_active, features, feature_list, billing_cycle, cycle_months, parent_slug)
SELECT
  base.slug || '-trimestral',
  base.name || ' Trimestral',
  v.price_q,
  v.credits_q,
  base.display_order,
  true,
  base.features,
  base.feature_list,
  'QUARTERLY',
  3,
  base.slug
FROM public.subscription_plans base
JOIN (VALUES
  ('essencial',   105.00::numeric, 90),
  ('performance', 215.00::numeric, 1290),
  ('elite',       399.00::numeric, 3000)
) AS v(parent, price_q, credits_q) ON v.parent = base.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_plans sp WHERE sp.slug = base.slug || '-trimestral'
);

INSERT INTO public.subscription_plans
  (slug, name, price, monthly_credits, display_order, is_active, features, feature_list, billing_cycle, cycle_months, parent_slug)
SELECT
  base.slug || '-anual',
  base.name || ' Anual',
  v.price_y,
  v.credits_y,
  base.display_order,
  true,
  base.features,
  base.feature_list,
  'YEARLY',
  12,
  base.slug
FROM public.subscription_plans base
JOIN (VALUES
  ('essencial',    360.00::numeric, 360),
  ('performance',  720.00::numeric, 5160),
  ('elite',       1380.00::numeric, 12000)
) AS v(parent, price_y, credits_y) ON v.parent = base.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_plans sp WHERE sp.slug = base.slug || '-anual'
);
