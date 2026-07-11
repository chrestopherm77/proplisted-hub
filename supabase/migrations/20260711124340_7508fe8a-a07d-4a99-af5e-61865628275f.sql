UPDATE public.subscription_plans
SET feature_list = feature_list || '["50% de desconto na compra de créditos e leads"]'::jsonb
WHERE price > 0
  AND NOT (feature_list @> '["50% de desconto na compra de créditos e leads"]'::jsonb);