CREATE OR REPLACE FUNCTION public.consume_credits_for_creative(
  p_user_id uuid,
  p_creative_id uuid,
  p_amount integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'Valor inválido');
  END IF;

  SELECT credit_balance INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Perfil não encontrado');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object(
      'error', 'Créditos insuficientes',
      'balance', v_balance,
      'needed', p_amount
    );
  END IF;

  UPDATE public.profiles
  SET credit_balance = credit_balance - p_amount
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, lead_id, credits_used, type)
  VALUES (p_user_id, NULL, p_amount, 'CREATIVE_GENERATION');

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_balance - p_amount,
    'creative_id', p_creative_id
  );
END;
$$;