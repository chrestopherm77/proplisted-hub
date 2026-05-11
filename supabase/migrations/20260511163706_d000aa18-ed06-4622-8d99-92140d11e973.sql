CREATE UNIQUE INDEX IF NOT EXISTS broker_portals_custom_domain_unique
  ON public.broker_portals (lower(custom_domain))
  WHERE custom_domain IS NOT NULL;