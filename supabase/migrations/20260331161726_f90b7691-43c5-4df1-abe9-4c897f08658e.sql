
-- Atomic increment for purchase_count (prevents race conditions)
CREATE OR REPLACE FUNCTION public.increment_purchase_count(p_lead_id uuid)
RETURNS TABLE(new_count integer, max_purchases integer, is_now_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count integer;
  v_max integer;
  v_active boolean;
BEGIN
  UPDATE leads
  SET purchase_count = COALESCE(purchase_count, 0) + 1
  WHERE id = p_lead_id
  RETURNING leads.purchase_count, leads.max_purchases
  INTO v_new_count, v_max;

  v_active := v_new_count < COALESCE(v_max, 3);

  UPDATE leads SET is_active = v_active WHERE id = p_lead_id;

  RETURN QUERY SELECT v_new_count, v_max, v_active;
END;
$$;

-- Atomic voucher redemption (prevents race conditions)
CREATE OR REPLACE FUNCTION public.redeem_voucher_atomic(
  p_voucher_id uuid,
  p_user_id uuid,
  p_lead_id uuid,
  p_voucher_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voucher record;
  v_total_redemptions bigint;
  v_user_redemptions bigint;
  v_existing_purchase uuid;
  v_lead record;
BEGIN
  -- Lock the voucher row to prevent concurrent redemptions
  SELECT * INTO v_voucher FROM vouchers WHERE id = p_voucher_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Voucher não encontrado');
  END IF;

  IF NOT v_voucher.is_active THEN
    RETURN jsonb_build_object('error', 'Este voucher não está mais ativo');
  END IF;

  IF v_voucher.expires_at IS NOT NULL AND v_voucher.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Este voucher já expirou');
  END IF;

  -- Check total redemptions
  SELECT COUNT(*) INTO v_total_redemptions FROM voucher_redemptions WHERE voucher_id = p_voucher_id;
  IF v_total_redemptions >= v_voucher.max_uses THEN
    RETURN jsonb_build_object('error', 'Este voucher já atingiu o limite de usos');
  END IF;

  -- Check per-user
  SELECT COUNT(*) INTO v_user_redemptions FROM voucher_redemptions WHERE voucher_id = p_voucher_id AND user_id = p_user_id;
  IF v_user_redemptions >= COALESCE(v_voucher.max_uses_per_user, 1) THEN
    RETURN jsonb_build_object('error', 'Você já atingiu o limite de usos deste voucher');
  END IF;

  -- Check lead
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lead não encontrado');
  END IF;
  IF NOT v_lead.is_active THEN
    RETURN jsonb_build_object('error', 'Este lead não está mais disponível');
  END IF;
  IF v_lead.purchase_count >= v_lead.max_purchases THEN
    RETURN jsonb_build_object('error', 'Este lead já atingiu o limite de vendas');
  END IF;

  -- Check existing purchase
  SELECT id INTO v_existing_purchase FROM purchases WHERE user_id = p_user_id AND lead_id = p_lead_id AND status = 'PAID' LIMIT 1;
  IF v_existing_purchase IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Você já possui este lead');
  END IF;

  -- Create purchase
  INSERT INTO purchases (user_id, lead_id, amount, status, payment_confirmed_at, payment_method, coupon_code)
  VALUES (p_user_id, p_lead_id, 0, 'PAID', now(), 'VOUCHER', p_voucher_code);

  -- Create redemption
  INSERT INTO voucher_redemptions (voucher_id, user_id, lead_id) VALUES (p_voucher_id, p_user_id, p_lead_id);

  -- Increment purchase count atomically
  UPDATE leads SET purchase_count = COALESCE(purchase_count, 0) + 1 WHERE id = p_lead_id;
  UPDATE leads SET is_active = (purchase_count < COALESCE(max_purchases, 3)) WHERE id = p_lead_id;

  -- Remove from cart
  DELETE FROM shopping_cart WHERE user_id = p_user_id AND lead_id = p_lead_id;

  RETURN jsonb_build_object('success', true, 'message', 'Voucher resgatado com sucesso!');
END;
$$;
