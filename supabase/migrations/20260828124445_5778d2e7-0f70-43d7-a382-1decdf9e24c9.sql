ALTER TABLE public.benefits
  ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS usage_limit text NOT NULL DEFAULT 'MONTHLY_1';

ALTER TABLE public.benefits DROP CONSTRAINT IF EXISTS benefits_usage_limit_check;
ALTER TABLE public.benefits ADD CONSTRAINT benefits_usage_limit_check
  CHECK (usage_limit IN ('MONTHLY_1','MONTHLY_2','UNLIMITED'));

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid='public.benefit_redemptions'::regclass AND contype='u'
  LOOP
    EXECUTE format('ALTER TABLE public.benefit_redemptions DROP CONSTRAINT %I', r.conname);
  END LOOP;
  FOR r IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname='public' AND tablename='benefit_redemptions'
      AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%reference_month%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.indexname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.lookup_benefit_voucher(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_partner uuid;
  r record;
  v_month date := date_trunc('month', now())::date;
  v_count int;
  v_max int;
  v_used boolean;
BEGIN
  SELECT id INTO v_partner FROM public.benefit_partners WHERE user_id = auth.uid() AND status = 'APPROVED';
  IF v_partner IS NULL THEN
    RETURN jsonb_build_object('error', 'Parceiro não autorizado');
  END IF;

  SELECT v.id, v.user_id, v.benefit_id, b.title, b.discount_percent, b.discount_label, b.usage_limit,
         p.name AS broker_name, p.phone AS broker_phone
    INTO r
  FROM public.benefit_vouchers v
  JOIN public.benefits b ON b.id = v.benefit_id
  LEFT JOIN public.profiles p ON p.id = v.user_id
  WHERE upper(v.code) = upper(trim(p_code)) AND b.partner_id = v_partner;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Voucher não encontrado para os seus benefícios');
  END IF;

  SELECT count(*) INTO v_count FROM public.benefit_redemptions
  WHERE benefit_id = r.benefit_id AND user_id = r.user_id AND reference_month = v_month;

  v_max := CASE r.usage_limit WHEN 'MONTHLY_2' THEN 2 WHEN 'UNLIMITED' THEN NULL ELSE 1 END;
  v_used := v_max IS NOT NULL AND v_count >= v_max;

  RETURN jsonb_build_object(
    'success', true,
    'voucher_id', r.id,
    'benefit_title', r.title,
    'discount_percent', r.discount_percent,
    'discount_label', r.discount_label,
    'usage_limit', r.usage_limit,
    'uses_this_month', v_count,
    'broker_name', r.broker_name,
    'broker_phone', r.broker_phone,
    'used_this_month', v_used
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.redeem_benefit_voucher(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_partner uuid;
  r record;
  v_month date := date_trunc('month', now())::date;
  v_count int;
  v_max int;
BEGIN
  SELECT id INTO v_partner FROM public.benefit_partners WHERE user_id = auth.uid() AND status = 'APPROVED';
  IF v_partner IS NULL THEN
    RETURN jsonb_build_object('error', 'Parceiro não autorizado');
  END IF;

  SELECT v.id, v.user_id, v.benefit_id, b.usage_limit INTO r
  FROM public.benefit_vouchers v
  JOIN public.benefits b ON b.id = v.benefit_id
  WHERE upper(v.code) = upper(trim(p_code)) AND b.partner_id = v_partner
  FOR UPDATE OF v;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Voucher não encontrado para os seus benefícios');
  END IF;

  SELECT count(*) INTO v_count FROM public.benefit_redemptions
  WHERE benefit_id = r.benefit_id AND user_id = r.user_id AND reference_month = v_month;

  v_max := CASE r.usage_limit WHEN 'MONTHLY_2' THEN 2 WHEN 'UNLIMITED' THEN NULL ELSE 1 END;

  IF v_max IS NOT NULL AND v_count >= v_max THEN
    RETURN jsonb_build_object('error', 'Limite de uso deste benefício já atingido neste mês');
  END IF;

  INSERT INTO public.benefit_redemptions (voucher_id, benefit_id, partner_id, user_id, reference_month)
  VALUES (r.id, r.benefit_id, v_partner, r.user_id, v_month);

  RETURN jsonb_build_object('success', true, 'message', 'Voucher validado com sucesso');
END;
$function$;