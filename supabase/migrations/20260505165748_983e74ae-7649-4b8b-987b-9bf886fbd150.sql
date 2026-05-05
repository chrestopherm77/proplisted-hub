-- ==== AFFILIATES ====
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  commission_percent numeric NOT NULL DEFAULT 20 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(code);

CREATE TRIGGER trg_affiliates_updated
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage affiliates" ON public.affiliates
  FOR ALL USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Affiliate views own row" ON public.affiliates
  FOR SELECT USING (auth.uid() = user_id);

-- ==== REFERRALS ====
CREATE TABLE public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_affiliate_referrals_affiliate ON public.affiliate_referrals(affiliate_id);

ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage referrals" ON public.affiliate_referrals
  FOR ALL USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Affiliate views own referrals" ON public.affiliate_referrals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
  );

-- ==== COMMISSIONS ====
CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL,
  subscription_id uuid,
  asaas_payment_id text UNIQUE,
  plan_slug text,
  plan_name text,
  gross_amount numeric NOT NULL DEFAULT 0,
  commission_percent numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  reference_month date NOT NULL DEFAULT date_trunc('month', now())::date,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','CANCELED')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aff_comm_affiliate ON public.affiliate_commissions(affiliate_id);
CREATE INDEX idx_aff_comm_month ON public.affiliate_commissions(reference_month);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage commissions" ON public.affiliate_commissions
  FOR ALL USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Affiliate views own commissions" ON public.affiliate_commissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid())
  );

-- ==== Helpers ====

-- Vincula referral ao se cadastrar
CREATE OR REPLACE FUNCTION public.register_affiliate_referral(p_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_affiliate_id uuid;
  v_code text := lower(trim(coalesce(p_code,'')));
BEGIN
  IF v_code = '' OR p_user_id IS NULL THEN
    RETURN jsonb_build_object('skipped', true);
  END IF;
  SELECT id INTO v_affiliate_id FROM public.affiliates
    WHERE lower(code) = v_code AND is_active = true LIMIT 1;
  IF v_affiliate_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Código de afiliado inválido');
  END IF;

  INSERT INTO public.affiliate_referrals (affiliate_id, referred_user_id)
  VALUES (v_affiliate_id, p_user_id)
  ON CONFLICT (referred_user_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'affiliate_id', v_affiliate_id);
END; $$;

-- Registra comissão (idempotente por asaas_payment_id)
CREATE OR REPLACE FUNCTION public.record_affiliate_commission(
  p_user_id uuid,
  p_subscription_id uuid,
  p_asaas_payment_id text,
  p_amount numeric,
  p_plan_slug text,
  p_plan_name text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_aff record;
  v_ref record;
  v_commission numeric;
BEGIN
  SELECT * INTO v_ref FROM public.affiliate_referrals WHERE referred_user_id = p_user_id LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('skipped', 'sem referral'); END IF;

  SELECT * INTO v_aff FROM public.affiliates WHERE id = v_ref.affiliate_id AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('skipped', 'afiliado inativo'); END IF;

  v_commission := round((coalesce(p_amount,0) * v_aff.commission_percent / 100)::numeric, 2);

  INSERT INTO public.affiliate_commissions (
    affiliate_id, referred_user_id, subscription_id, asaas_payment_id,
    plan_slug, plan_name, gross_amount, commission_percent, commission_amount,
    reference_month
  ) VALUES (
    v_aff.id, p_user_id, p_subscription_id, p_asaas_payment_id,
    p_plan_slug, p_plan_name, coalesce(p_amount,0), v_aff.commission_percent, v_commission,
    date_trunc('month', now())::date
  )
  ON CONFLICT (asaas_payment_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'commission', v_commission, 'affiliate_id', v_aff.id);
END; $$;

-- Painel do afiliado
CREATE OR REPLACE FUNCTION public.get_affiliate_dashboard(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_aff record;
  v_total_referrals int := 0;
  v_paying int := 0;
  v_month_total numeric := 0;
  v_all_total numeric := 0;
  v_pending numeric := 0;
  v_paid numeric := 0;
  v_by_month jsonb;
BEGIN
  SELECT * INTO v_aff FROM public.affiliates WHERE user_id = p_user_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('is_affiliate', false);
  END IF;

  SELECT count(*) INTO v_total_referrals FROM public.affiliate_referrals WHERE affiliate_id = v_aff.id;
  SELECT count(DISTINCT referred_user_id) INTO v_paying FROM public.affiliate_commissions WHERE affiliate_id = v_aff.id;

  SELECT coalesce(sum(commission_amount),0) INTO v_month_total
    FROM public.affiliate_commissions
    WHERE affiliate_id = v_aff.id AND reference_month = date_trunc('month', now())::date;

  SELECT coalesce(sum(commission_amount),0) INTO v_all_total
    FROM public.affiliate_commissions WHERE affiliate_id = v_aff.id;

  SELECT coalesce(sum(commission_amount),0) INTO v_pending
    FROM public.affiliate_commissions WHERE affiliate_id = v_aff.id AND status = 'PENDING';
  SELECT coalesce(sum(commission_amount),0) INTO v_paid
    FROM public.affiliate_commissions WHERE affiliate_id = v_aff.id AND status = 'PAID';

  SELECT coalesce(jsonb_agg(jsonb_build_object('month', m, 'total', t) ORDER BY m DESC), '[]'::jsonb)
    INTO v_by_month
    FROM (
      SELECT reference_month AS m, sum(commission_amount) AS t
      FROM public.affiliate_commissions
      WHERE affiliate_id = v_aff.id
      GROUP BY reference_month
      ORDER BY reference_month DESC
      LIMIT 12
    ) x;

  RETURN jsonb_build_object(
    'is_affiliate', true,
    'affiliate', jsonb_build_object(
      'id', v_aff.id, 'name', v_aff.name, 'email', v_aff.email,
      'code', v_aff.code, 'commission_percent', v_aff.commission_percent
    ),
    'total_referrals', v_total_referrals,
    'paying_referrals', v_paying,
    'month_total', v_month_total,
    'all_total', v_all_total,
    'pending_total', v_pending,
    'paid_total', v_paid,
    'by_month', v_by_month
  );
END; $$;

-- Auto-vincular afiliado ao perfil pelo email no insert/update do profile
CREATE OR REPLACE FUNCTION public.link_affiliate_on_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.affiliates
      SET user_id = NEW.id, updated_at = now()
      WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_link_affiliate_on_profile
  AFTER INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.link_affiliate_on_profile();