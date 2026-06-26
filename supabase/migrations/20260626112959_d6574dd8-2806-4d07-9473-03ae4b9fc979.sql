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

  IF v_lead.purchase_count >= COALESCE(v_lead.max_purchases, 3) THEN
    RETURN jsonb_build_object('error', 'Este lead já atingiu o limite de vendas');
  END IF;

  SELECT id INTO v_existing_purchase FROM purchases
    WHERE user_id = p_user_id AND lead_id = p_lead_id AND status = 'PAID' LIMIT 1;
  IF v_existing_purchase IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Você já possui este lead');
  END IF;

  -- Determina se é assinante de plano pago (admin não cai aqui pois RPC roda lógica de negócio)
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