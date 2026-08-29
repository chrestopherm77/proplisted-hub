
-- 1) Colunas de classificação
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'GOLD',
  ADD COLUMN IF NOT EXISTS exclusive_user_id uuid,
  ADD COLUMN IF NOT EXISTS exclusive_until timestamptz,
  ADD COLUMN IF NOT EXISTS source_portal_lead_id uuid,
  ADD COLUMN IF NOT EXISTS source_partial_lead_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_tier_check') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_tier_check CHECK (tier IN ('GOLD','SILVER','BRONZE'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS leads_source_portal_lead_id_key ON public.leads(source_portal_lead_id) WHERE source_portal_lead_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS leads_source_partial_lead_id_key ON public.leads(source_partial_lead_id) WHERE source_partial_lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_tier_idx ON public.leads(tier);

-- 2) Visibilidade: durante a exclusividade, só o dono e admins veem
DROP POLICY IF EXISTS "Anyone authenticated can view active leads" ON public.leads;
CREATE POLICY "Anyone authenticated can view active leads"
ON public.leads FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_active = true
  AND (
    exclusive_until IS NULL
    OR exclusive_until <= now()
    OR exclusive_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'MASTER_ADMIN')
  )
);

-- 3) Compra respeita exclusividade de 24h
CREATE OR REPLACE FUNCTION public.purchase_lead_with_credits(p_user_id uuid, p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile record;
  v_lead record;
  v_existing_purchase uuid;
  v_new_count integer;
  v_max integer;
  v_active boolean;
  v_is_subscriber boolean;
  v_effective_credits integer;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Perfil não encontrado');
  END IF;

  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lead não encontrado');
  END IF;

  IF NOT v_lead.is_active THEN
    RETURN jsonb_build_object('error', 'Este lead não está mais disponível');
  END IF;

  IF v_lead.exclusive_until IS NOT NULL
     AND v_lead.exclusive_until > now()
     AND v_lead.exclusive_user_id IS DISTINCT FROM p_user_id
     AND NOT public.has_role(p_user_id, 'MASTER_ADMIN') THEN
    RETURN jsonb_build_object('error', 'Este lead está em exclusividade com outro corretor');
  END IF;

  IF v_lead.purchase_count >= COALESCE(v_lead.max_purchases, 3) THEN
    RETURN jsonb_build_object('error', 'Este lead já atingiu o limite de vendas');
  END IF;

  SELECT id INTO v_existing_purchase FROM purchases
    WHERE user_id = p_user_id AND lead_id = p_lead_id AND status = 'PAID' LIMIT 1;
  IF v_existing_purchase IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Você já possui este lead');
  END IF;

  v_is_subscriber := public.has_active_paid_plan(p_user_id)
                     OR public.has_role(p_user_id, 'MASTER_ADMIN');

  v_effective_credits := CASE WHEN v_is_subscriber THEN v_lead.price::integer
                              ELSE (v_lead.price * 2)::integer END;

  IF v_profile.credit_balance < v_effective_credits THEN
    RETURN jsonb_build_object('error', 'Saldo de créditos insuficiente', 'needed', v_effective_credits, 'balance', v_profile.credit_balance);
  END IF;

  UPDATE profiles SET credit_balance = credit_balance - v_effective_credits WHERE id = p_user_id;

  INSERT INTO purchases (user_id, lead_id, amount, status, payment_confirmed_at, payment_method)
  VALUES (p_user_id, p_lead_id, v_effective_credits, 'PAID', now(), 'CREDITS');

  INSERT INTO credit_transactions (user_id, lead_id, credits_used, type)
  VALUES (p_user_id, p_lead_id, v_effective_credits, 'LEAD_PURCHASE');

  UPDATE leads SET purchase_count = COALESCE(purchase_count, 0) + 1 WHERE id = p_lead_id
  RETURNING purchase_count, max_purchases INTO v_new_count, v_max;

  v_active := v_new_count < COALESCE(v_max, 3);
  UPDATE leads SET is_active = v_active WHERE id = p_lead_id;

  DELETE FROM shopping_cart WHERE user_id = p_user_id AND lead_id = p_lead_id;

  RETURN jsonb_build_object('success', true, 'message', 'Lead comprado com sucesso!',
    'credits_used', v_effective_credits,
    'new_balance', v_profile.credit_balance - v_effective_credits,
    'is_subscriber', v_is_subscriber);
END;
$function$;

-- 4) Lead Prata automático a partir do Portal Conectaê
CREATE OR REPLACE FUNCTION public.create_silver_lead_from_portal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prop record;
  v_desc text;
BEGIN
  SELECT reference_code, title, city, state, neighborhood, property_type, operation_type, price_sale, price_rent
    INTO v_prop FROM public.properties WHERE id = NEW.property_id;

  v_desc := 'Interesse no imóvel ' || COALESCE(v_prop.reference_code, '') ||
            COALESCE(' - ' || v_prop.title, '') ||
            COALESCE(' em ' || v_prop.city, '') || COALESCE('/' || v_prop.state, '');

  INSERT INTO public.leads (
    name, phone, description, price, max_purchases, is_active,
    whatsapp_confirmed, tier, exclusive_user_id, exclusive_until,
    source_portal_lead_id, form_data
  ) VALUES (
    NEW.name, NEW.phone, v_desc, 100, 3, true,
    true, 'SILVER', NEW.broker_user_id, now() + interval '24 hours',
    NEW.id,
    jsonb_build_object(
      'origem', 'PORTAL_CONECTAE',
      'property_id', NEW.property_id,
      'reference_code', v_prop.reference_code,
      'city', v_prop.city,
      'state', v_prop.state,
      'neighborhood', v_prop.neighborhood,
      'property_type', v_prop.property_type,
      'operation_type', v_prop.operation_type
    )
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_portal_lead_to_silver ON public.portal_property_leads;
CREATE TRIGGER trg_portal_lead_to_silver
AFTER INSERT ON public.portal_property_leads
FOR EACH ROW EXECUTE FUNCTION public.create_silver_lead_from_portal();
