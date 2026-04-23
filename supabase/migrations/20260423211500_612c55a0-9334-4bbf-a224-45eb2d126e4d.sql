CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id UUID;
  v_input_code TEXT;
  v_conexao_plan_id UUID;
  v_conexao_credits INTEGER;
BEGIN
  v_input_code := NULLIF(UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'referral_code',''))), '');

  IF v_input_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_input_code LIMIT 1;
  END IF;

  INSERT INTO public.profiles (
    id, name, phone, email, creci_number, accepted_terms,
    person_type, cpf, address, address_uf, address_city, address_neighborhood,
    company_name, cnpj, company_type,
    creci_pj, creci_pj_uf, crea_pj, crea_pj_uf,
    rt_name, rt_cpf, rt_crea, rt_crea_uf, rt_cau, rt_cau_uf,
    profession, creci, creci_uf, cau, cau_uf, crea, crea_uf,
    referral_code, referred_by
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'company_name'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    NEW.raw_user_meta_data->>'creci_number',
    COALESCE((NEW.raw_user_meta_data->>'accepted_terms')::BOOLEAN, false),
    NEW.raw_user_meta_data->>'person_type',
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'address_uf',
    NEW.raw_user_meta_data->>'address_city',
    NEW.raw_user_meta_data->>'address_neighborhood',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'cnpj',
    NEW.raw_user_meta_data->>'company_type',
    NEW.raw_user_meta_data->>'creci_pj',
    NEW.raw_user_meta_data->>'creci_pj_uf',
    NEW.raw_user_meta_data->>'crea_pj',
    NEW.raw_user_meta_data->>'crea_pj_uf',
    NEW.raw_user_meta_data->>'rt_name',
    NEW.raw_user_meta_data->>'rt_cpf',
    NEW.raw_user_meta_data->>'rt_crea',
    NEW.raw_user_meta_data->>'rt_crea_uf',
    NEW.raw_user_meta_data->>'rt_cau',
    NEW.raw_user_meta_data->>'rt_cau_uf',
    NEW.raw_user_meta_data->>'profession',
    NEW.raw_user_meta_data->>'creci',
    NEW.raw_user_meta_data->>'creci_uf',
    NEW.raw_user_meta_data->>'cau',
    NEW.raw_user_meta_data->>'cau_uf',
    NEW.raw_user_meta_data->>'crea',
    NEW.raw_user_meta_data->>'crea_uf',
    public.generate_referral_code(),
    v_referrer_id
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'USER');

  -- Auto-provisionar plano CONEXÃO (gratuito) + 10 créditos
  SELECT id, monthly_credits INTO v_conexao_plan_id, v_conexao_credits
  FROM public.subscription_plans
  WHERE slug = 'conexao' AND is_active = true
  LIMIT 1;

  IF v_conexao_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (
      user_id, plan_id, status, payment_method,
      current_period_start, current_period_end
    ) VALUES (
      NEW.id, v_conexao_plan_id, 'ACTIVE', 'FREE',
      now(), now() + INTERVAL '1 month'
    );

    UPDATE public.profiles
    SET credit_balance = credit_balance + COALESCE(v_conexao_credits, 10)
    WHERE id = NEW.id;

    INSERT INTO public.credit_transactions (user_id, lead_id, credits_used, type)
    VALUES (NEW.id, NULL, COALESCE(v_conexao_credits, 10), 'SUBSCRIPTION_RENEWAL');
  END IF;

  RETURN NEW;
END;
$function$;