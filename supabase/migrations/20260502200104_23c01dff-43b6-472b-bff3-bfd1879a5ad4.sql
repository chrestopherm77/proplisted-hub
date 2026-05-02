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
  v_meta jsonb;
  v_person_type text;
  v_name text;
  v_phone text;
  v_is_oauth boolean;
BEGIN
  v_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  -- Detecta se veio de OAuth (Google etc.) — nesse caso o metadata costuma trazer
  -- name/full_name/avatar_url mas não traz person_type/phone do nosso form.
  v_is_oauth := (v_meta ? 'iss') OR (v_meta ? 'provider_id') OR (v_meta ? 'sub')
                OR NULLIF(TRIM(COALESCE(v_meta->>'person_type','')), '') IS NULL;

  IF v_is_oauth AND NULLIF(TRIM(COALESCE(v_meta->>'person_type','')), '') IS NULL THEN
    -- Caminho OAuth: pula validação rígida, monta defaults mínimos.
    v_name := COALESCE(
      NULLIF(TRIM(COALESCE(v_meta->>'name','')), ''),
      NULLIF(TRIM(COALESCE(v_meta->>'full_name','')), ''),
      split_part(NEW.email, '@', 1)
    );
    v_phone := COALESCE(NULLIF(TRIM(COALESCE(v_meta->>'phone','')), ''), '');
    v_person_type := 'PF';
  ELSE
    -- Caminho clássico: valida obrigatórios mínimos
    PERFORM public.validate_signup_metadata(v_meta);
    v_name := COALESCE(v_meta->>'name', v_meta->>'company_name');
    v_phone := COALESCE(v_meta->>'phone', '');
    v_person_type := v_meta->>'person_type';
  END IF;

  v_input_code := NULLIF(UPPER(TRIM(COALESCE(v_meta->>'referral_code',''))), '');
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
    v_name,
    v_phone,
    NEW.email,
    v_meta->>'creci_number',
    false, -- termos sempre falsos no signup; aceitos depois em "completar perfil"
    v_person_type,
    v_meta->>'cpf',
    v_meta->>'address',
    v_meta->>'address_uf',
    v_meta->>'address_city',
    v_meta->>'address_neighborhood',
    v_meta->>'company_name',
    v_meta->>'cnpj',
    v_meta->>'company_type',
    v_meta->>'creci_pj',
    v_meta->>'creci_pj_uf',
    v_meta->>'crea_pj',
    v_meta->>'crea_pj_uf',
    v_meta->>'rt_name',
    v_meta->>'rt_cpf',
    v_meta->>'rt_crea',
    v_meta->>'rt_crea_uf',
    v_meta->>'rt_cau',
    v_meta->>'rt_cau_uf',
    v_meta->>'profession',
    v_meta->>'creci',
    v_meta->>'creci_uf',
    v_meta->>'cau',
    v_meta->>'cau_uf',
    v_meta->>'crea',
    v_meta->>'crea_uf',
    public.generate_referral_code(),
    v_referrer_id
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'USER');

  -- Auto-provisionar plano CONEXÃO
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