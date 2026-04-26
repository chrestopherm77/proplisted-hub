-- 1. Substitui redeem_referral: apenas registra a indicação, NÃO credita
CREATE OR REPLACE FUNCTION public.redeem_referral(p_user_id uuid, p_referral_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user RECORD;
  v_referrer_id UUID;
  v_code TEXT;
BEGIN
  v_code := UPPER(TRIM(COALESCE(p_referral_code, '')));
  IF v_code = '' THEN
    RETURN jsonb_build_object('error', 'Código de indicação inválido');
  END IF;

  SELECT * INTO v_user FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Perfil não encontrado');
  END IF;

  IF v_user.referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Indicação já registrada para este usuário');
  END IF;

  SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_code LIMIT 1;
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Código de indicação não encontrado');
  END IF;

  IF v_referrer_id = p_user_id THEN
    RETURN jsonb_build_object('error', 'Você não pode usar seu próprio código');
  END IF;

  -- Apenas marca o indicador. O bônus só é pago após assinatura paga.
  UPDATE public.profiles
    SET referred_by = v_referrer_id
    WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Indicação registrada! Seu indicador receberá os créditos quando você ativar uma assinatura paga.'
  );
END;
$function$;

-- 2. Nova função: concede o bônus se elegível (indicado tem assinatura paga ativa)
CREATE OR REPLACE FUNCTION public.grant_referral_bonus_if_eligible(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile RECORD;
  v_has_paid_sub BOOLEAN;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Perfil não encontrado');
  END IF;

  IF v_profile.referred_by IS NULL THEN
    RETURN jsonb_build_object('skipped', 'Sem indicador');
  END IF;

  IF v_profile.referral_credits_granted = true THEN
    RETURN jsonb_build_object('skipped', 'Bônus já concedido');
  END IF;

  -- Verifica assinatura paga ativa (qualquer plano com price > 0 e slug != 'conexao')
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = p_user_id
      AND us.status = 'ACTIVE'
      AND sp.slug <> 'conexao'
      AND sp.price > 0
  ) INTO v_has_paid_sub;

  IF NOT v_has_paid_sub THEN
    RETURN jsonb_build_object('skipped', 'Sem assinatura paga ativa');
  END IF;

  -- Marca como concedido (lock evita duplicidade)
  UPDATE public.profiles
    SET referral_credits_granted = true
    WHERE id = p_user_id;

  -- Credita 280 ao indicador
  UPDATE public.profiles
    SET credit_balance = credit_balance + 280
    WHERE id = v_profile.referred_by;

  INSERT INTO public.credit_transactions (user_id, lead_id, credits_used, type)
  VALUES (v_profile.referred_by, NULL, 280, 'REFERRAL_BONUS');

  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_profile.referred_by,
    'credits', 280
  );
END;
$function$;

-- 3. Backfill: indicados existentes com plano pago ativo geram bônus retroativo
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT p.id
    FROM public.profiles p
    WHERE p.referred_by IS NOT NULL
      AND p.referral_credits_granted = false
      AND EXISTS (
        SELECT 1
        FROM public.user_subscriptions us
        JOIN public.subscription_plans sp ON sp.id = us.plan_id
        WHERE us.user_id = p.id
          AND us.status = 'ACTIVE'
          AND sp.slug <> 'conexao'
          AND sp.price > 0
      )
  LOOP
    PERFORM public.grant_referral_bonus_if_eligible(rec.id);
  END LOOP;
END $$;