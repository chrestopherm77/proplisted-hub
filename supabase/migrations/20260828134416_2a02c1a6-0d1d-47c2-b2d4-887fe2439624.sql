CREATE TABLE public.portal_property_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  broker_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'PORTAL_CONECTAE',
  webhook_status TEXT NOT NULL DEFAULT 'PENDING',
  webhook_last_error TEXT,
  webhook_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.portal_property_leads TO authenticated;
GRANT ALL ON public.portal_property_leads TO service_role;

ALTER TABLE public.portal_property_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view portal leads"
ON public.portal_property_leads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins can update portal leads"
ON public.portal_property_leads FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE UNIQUE INDEX portal_property_leads_unique_interest
ON public.portal_property_leads (property_id, phone);

CREATE INDEX portal_property_leads_created_at_idx ON public.portal_property_leads (created_at DESC);

CREATE TRIGGER update_portal_property_leads_updated_at
BEFORE UPDATE ON public.portal_property_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_portal_property_lead(p_property_id uuid, p_name text, p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_digits text;
  v_name text;
  v_id uuid;
BEGIN
  v_name := btrim(coalesce(p_name, ''));
  IF length(v_name) < 2 OR length(v_name) > 120 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nome inválido');
  END IF;

  v_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  IF left(v_digits, 2) = '55' AND length(v_digits) > 11 THEN
    v_digits := substr(v_digits, 3);
  END IF;
  IF length(v_digits) = 11 AND substr(v_digits, 3, 1) = '9' THEN
    v_digits := substr(v_digits, 1, 2) || substr(v_digits, 4);
  END IF;
  IF length(v_digits) <> 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Telefone inválido');
  END IF;
  v_digits := '55' || v_digits;

  SELECT user_id INTO v_owner FROM public.properties
  WHERE id = p_property_id AND is_active = true;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Imóvel indisponível');
  END IF;

  INSERT INTO public.portal_property_leads (property_id, broker_user_id, name, phone)
  VALUES (p_property_id, v_owner, v_name, v_digits)
  ON CONFLICT (property_id, phone) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já demonstrou interesse neste imóvel', 'duplicate', true);
  END IF;

  RETURN jsonb_build_object('success', true, 'lead_id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_portal_property_lead(uuid, text, text) TO anon, authenticated;