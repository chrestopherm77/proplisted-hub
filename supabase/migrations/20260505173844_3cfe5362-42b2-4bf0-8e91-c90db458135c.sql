
CREATE TABLE public.broker_portals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  template_id INTEGER NOT NULL DEFAULT 1 CHECK (template_id IN (1, 2, 3)),
  is_active BOOLEAN NOT NULL DEFAULT false,
  properties_source TEXT NOT NULL DEFAULT 'OWN' CHECK (properties_source IN ('OWN', 'CITY')),
  city TEXT,
  state TEXT,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_broker_portals_user_id ON public.broker_portals(user_id);
CREATE INDEX idx_broker_portals_custom_domain ON public.broker_portals(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_broker_portals_active ON public.broker_portals(is_active) WHERE is_active = true;

ALTER TABLE public.broker_portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broker portals"
ON public.broker_portals
FOR ALL
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE POLICY "Owner views own portal"
ON public.broker_portals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Public views active portals"
ON public.broker_portals
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE TRIGGER update_broker_portals_updated_at
BEFORE UPDATE ON public.broker_portals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
