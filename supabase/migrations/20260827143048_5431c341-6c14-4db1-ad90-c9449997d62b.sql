-- PARTNERS
CREATE TABLE public.benefit_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  logo_url text,
  status text NOT NULL DEFAULT 'PENDING',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.benefit_partners TO authenticated;
GRANT ALL ON public.benefit_partners TO service_role;
ALTER TABLE public.benefit_partners ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_approved_benefit_partner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.benefit_partners WHERE user_id = _user_id AND status = 'APPROVED')
$$;

CREATE POLICY "Partner reads own row" ON public.benefit_partners
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'MASTER_ADMIN'));
CREATE POLICY "Partner creates own row" ON public.benefit_partners
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'PENDING');
CREATE POLICY "Admin updates partners" ON public.benefit_partners
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'MASTER_ADMIN')) WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));
CREATE POLICY "Admin deletes partners" ON public.benefit_partners
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- BENEFITS
CREATE TABLE public.benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.benefit_partners(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  rules text,
  discount_percent numeric,
  discount_label text,
  banner_url text,
  state text,
  city text,
  link_url text,
  address text,
  status text NOT NULL DEFAULT 'PENDING',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.benefits TO authenticated;
GRANT ALL ON public.benefits TO service_role;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved benefits readable" ON public.benefits
FOR SELECT TO authenticated USING (
  (status = 'APPROVED' AND is_active = true)
  OR public.has_role(auth.uid(), 'MASTER_ADMIN')
  OR partner_id IN (SELECT id FROM public.benefit_partners WHERE user_id = auth.uid())
);
CREATE POLICY "Partner creates own benefits" ON public.benefits
FOR INSERT TO authenticated WITH CHECK (
  public.is_approved_benefit_partner(auth.uid())
  AND partner_id IN (SELECT id FROM public.benefit_partners WHERE user_id = auth.uid())
  AND status = 'PENDING'
);
CREATE POLICY "Partner updates own benefits" ON public.benefits
FOR UPDATE TO authenticated USING (
  partner_id IN (SELECT id FROM public.benefit_partners WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'MASTER_ADMIN')
) WITH CHECK (
  partner_id IN (SELECT id FROM public.benefit_partners WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'MASTER_ADMIN')
);
CREATE POLICY "Partner deletes own benefits" ON public.benefits
FOR DELETE TO authenticated USING (
  partner_id IN (SELECT id FROM public.benefit_partners WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'MASTER_ADMIN')
);

-- VOUCHERS
CREATE TABLE public.benefit_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_id uuid NOT NULL REFERENCES public.benefits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (benefit_id, user_id)
);
GRANT SELECT ON public.benefit_vouchers TO authenticated;
GRANT ALL ON public.benefit_vouchers TO service_role;
ALTER TABLE public.benefit_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voucher visible to owner partner admin" ON public.benefit_vouchers
FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'MASTER_ADMIN')
  OR benefit_id IN (
    SELECT b.id FROM public.benefits b
    JOIN public.benefit_partners p ON p.id = b.partner_id
    WHERE p.user_id = auth.uid()
  )
);

-- REDEMPTIONS
CREATE TABLE public.benefit_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES public.benefit_vouchers(id) ON DELETE CASCADE,
  benefit_id uuid NOT NULL REFERENCES public.benefits(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.benefit_partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reference_month date NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (benefit_id, user_id, reference_month)
);
GRANT SELECT ON public.benefit_redemptions TO authenticated;
GRANT ALL ON public.benefit_redemptions TO service_role;
ALTER TABLE public.benefit_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redemption visible to owner partner admin" ON public.benefit_redemptions
FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'MASTER_ADMIN')
  OR partner_id IN (SELECT id FROM public.benefit_partners WHERE user_id = auth.uid())
);

CREATE TRIGGER update_benefit_partners_updated_at BEFORE UPDATE ON public.benefit_partners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_benefits_updated_at BEFORE UPDATE ON public.benefits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GENERATE VOUCHER
CREATE OR REPLACE FUNCTION public.generate_benefit_voucher(p_benefit_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing public.benefit_vouchers%ROWTYPE;
  v_name text;
  v_doc text;
  v_letters text;
  v_digits text;
  v_code text;
  i int := 0;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('error', 'Não autenticado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.benefits WHERE id = p_benefit_id AND status = 'APPROVED' AND is_active = true) THEN
    RETURN jsonb_build_object('error', 'Benefício indisponível');
  END IF;

  SELECT * INTO v_existing FROM public.benefit_vouchers WHERE benefit_id = p_benefit_id AND user_id = v_user;
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'code', v_existing.code);
  END IF;

  SELECT name, COALESCE(NULLIF(regexp_replace(COALESCE(cpf,''), '\D', '', 'g'), ''), regexp_replace(COALESCE(cnpj,''), '\D', '', 'g'))
    INTO v_name, v_doc FROM public.profiles WHERE id = v_user;

  v_letters := upper(regexp_replace(translate(COALESCE(v_name,'COR'),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'), '[^A-Za-z]', '', 'g'));
  v_letters := rpad(left(COALESCE(NULLIF(v_letters,''), 'COR'), 3), 3, 'X');

  IF v_doc IS NULL OR length(v_doc) < 4 THEN
    v_digits := lpad((floor(random()*10000))::int::text, 4, '0');
  ELSE
    v_digits := right(v_doc, 4);
  END IF;

  LOOP
    i := i + 1;
    v_code := v_letters || v_digits || upper(substr(md5(random()::text), 1, 2));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.benefit_vouchers WHERE code = v_code) OR i > 20;
  END LOOP;

  INSERT INTO public.benefit_vouchers (benefit_id, user_id, code)
  VALUES (p_benefit_id, v_user, v_code)
  ON CONFLICT (benefit_id, user_id) DO UPDATE SET code = public.benefit_vouchers.code
  RETURNING * INTO v_existing;

  RETURN jsonb_build_object('success', true, 'code', v_existing.code);
END;
$$;

-- LOOKUP VOUCHER (partner)
CREATE OR REPLACE FUNCTION public.lookup_benefit_voucher(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_partner uuid;
  r record;
  v_month date := date_trunc('month', now())::date;
  v_used boolean;
BEGIN
  SELECT id INTO v_partner FROM public.benefit_partners WHERE user_id = auth.uid() AND status = 'APPROVED';
  IF v_partner IS NULL THEN
    RETURN jsonb_build_object('error', 'Parceiro não autorizado');
  END IF;

  SELECT v.id, v.user_id, v.benefit_id, b.title, b.discount_percent, b.discount_label, p.name AS broker_name, p.phone AS broker_phone
    INTO r
  FROM public.benefit_vouchers v
  JOIN public.benefits b ON b.id = v.benefit_id
  LEFT JOIN public.profiles p ON p.id = v.user_id
  WHERE upper(v.code) = upper(trim(p_code)) AND b.partner_id = v_partner;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Voucher não encontrado para os seus benefícios');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.benefit_redemptions
    WHERE benefit_id = r.benefit_id AND user_id = r.user_id AND reference_month = v_month
  ) INTO v_used;

  RETURN jsonb_build_object(
    'success', true,
    'voucher_id', r.id,
    'benefit_title', r.title,
    'discount_percent', r.discount_percent,
    'discount_label', r.discount_label,
    'broker_name', r.broker_name,
    'broker_phone', r.broker_phone,
    'used_this_month', v_used
  );
END;
$$;

-- REDEEM VOUCHER (partner)
CREATE OR REPLACE FUNCTION public.redeem_benefit_voucher(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_partner uuid;
  r record;
  v_month date := date_trunc('month', now())::date;
BEGIN
  SELECT id INTO v_partner FROM public.benefit_partners WHERE user_id = auth.uid() AND status = 'APPROVED';
  IF v_partner IS NULL THEN
    RETURN jsonb_build_object('error', 'Parceiro não autorizado');
  END IF;

  SELECT v.id, v.user_id, v.benefit_id INTO r
  FROM public.benefit_vouchers v
  JOIN public.benefits b ON b.id = v.benefit_id
  WHERE upper(v.code) = upper(trim(p_code)) AND b.partner_id = v_partner
  FOR UPDATE OF v;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Voucher não encontrado para os seus benefícios');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.benefit_redemptions
    WHERE benefit_id = r.benefit_id AND user_id = r.user_id AND reference_month = v_month
  ) THEN
    RETURN jsonb_build_object('error', 'Este voucher já foi utilizado neste mês');
  END IF;

  INSERT INTO public.benefit_redemptions (voucher_id, benefit_id, partner_id, user_id, reference_month)
  VALUES (r.id, r.benefit_id, v_partner, r.user_id, v_month);

  RETURN jsonb_build_object('success', true, 'message', 'Voucher validado com sucesso');
END;
$$;