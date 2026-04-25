-- Validação obrigatória de metadados no signup
CREATE OR REPLACE FUNCTION public.validate_signup_metadata(meta jsonb)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_person_type text;
  v_profession text;
  v_company_type text;
  v_accepted_contract boolean;
  v_accepted_dpa boolean;
  v_accepted_tou boolean;
BEGIN
  IF meta IS NULL THEN
    RAISE EXCEPTION 'Dados do cadastro ausentes';
  END IF;

  -- Comum: telefone e endereço
  IF NULLIF(TRIM(COALESCE(meta->>'phone','')), '') IS NULL THEN
    RAISE EXCEPTION 'Telefone é obrigatório';
  END IF;
  IF NULLIF(TRIM(COALESCE(meta->>'address','')), '') IS NULL THEN
    RAISE EXCEPTION 'Endereço é obrigatório';
  END IF;
  IF NULLIF(TRIM(COALESCE(meta->>'address_uf','')), '') IS NULL THEN
    RAISE EXCEPTION 'UF do endereço é obrigatória';
  END IF;
  IF NULLIF(TRIM(COALESCE(meta->>'address_city','')), '') IS NULL THEN
    RAISE EXCEPTION 'Cidade é obrigatória';
  END IF;
  IF NULLIF(TRIM(COALESCE(meta->>'address_neighborhood','')), '') IS NULL THEN
    RAISE EXCEPTION 'Bairro é obrigatório';
  END IF;

  -- Termos legais
  v_accepted_contract := COALESCE((meta->>'accepted_contract')::boolean, false);
  v_accepted_dpa := COALESCE((meta->>'accepted_dpa')::boolean, false);
  v_accepted_tou := COALESCE((meta->>'accepted_terms_of_use')::boolean, COALESCE((meta->>'accepted_terms')::boolean, false));

  IF NOT v_accepted_contract THEN
    RAISE EXCEPTION 'É necessário aceitar o Contrato de Parceria Comercial';
  END IF;
  IF NOT v_accepted_dpa THEN
    RAISE EXCEPTION 'É necessário aceitar o Acordo de Tratamento de Dados (DPA)';
  END IF;
  IF NOT v_accepted_tou THEN
    RAISE EXCEPTION 'É necessário aceitar os Termos de Uso e Política de Privacidade';
  END IF;

  -- Tipo de pessoa
  v_person_type := UPPER(NULLIF(TRIM(COALESCE(meta->>'person_type','')), ''));
  IF v_person_type IS NULL OR v_person_type NOT IN ('PF', 'PJ') THEN
    RAISE EXCEPTION 'Tipo de pessoa (PF ou PJ) é obrigatório';
  END IF;

  IF v_person_type = 'PF' THEN
    -- PF
    IF NULLIF(TRIM(COALESCE(meta->>'name','')), '') IS NULL THEN
      RAISE EXCEPTION 'Nome completo é obrigatório';
    END IF;
    IF NULLIF(TRIM(COALESCE(meta->>'cpf','')), '') IS NULL THEN
      RAISE EXCEPTION 'CPF é obrigatório';
    END IF;

    v_profession := UPPER(NULLIF(TRIM(COALESCE(meta->>'profession','')), ''));
    IF v_profession IS NULL OR v_profession NOT IN ('CORRETOR','ARQUITETO','ENGENHEIRO','NONE') THEN
      RAISE EXCEPTION 'Profissão é obrigatória';
    END IF;

    IF v_profession = 'CORRETOR' THEN
      IF NULLIF(TRIM(COALESCE(meta->>'creci','')), '') IS NULL THEN
        RAISE EXCEPTION 'Número do CRECI é obrigatório para corretores';
      END IF;
      IF NULLIF(TRIM(COALESCE(meta->>'creci_uf','')), '') IS NULL THEN
        RAISE EXCEPTION 'UF do CRECI é obrigatória';
      END IF;
    ELSIF v_profession = 'ARQUITETO' THEN
      IF NULLIF(TRIM(COALESCE(meta->>'cau','')), '') IS NULL THEN
        RAISE EXCEPTION 'Número do CAU é obrigatório para arquitetos';
      END IF;
      IF NULLIF(TRIM(COALESCE(meta->>'cau_uf','')), '') IS NULL THEN
        RAISE EXCEPTION 'UF do CAU é obrigatória';
      END IF;
    ELSIF v_profession = 'ENGENHEIRO' THEN
      IF NULLIF(TRIM(COALESCE(meta->>'crea','')), '') IS NULL THEN
        RAISE EXCEPTION 'Número do CREA é obrigatório para engenheiros';
      END IF;
      IF NULLIF(TRIM(COALESCE(meta->>'crea_uf','')), '') IS NULL THEN
        RAISE EXCEPTION 'UF do CREA é obrigatória';
      END IF;
    END IF;

  ELSE
    -- PJ
    IF NULLIF(TRIM(COALESCE(meta->>'company_name','')), '') IS NULL THEN
      RAISE EXCEPTION 'Razão social / Nome da empresa é obrigatório';
    END IF;
    IF NULLIF(TRIM(COALESCE(meta->>'cnpj','')), '') IS NULL THEN
      RAISE EXCEPTION 'CNPJ é obrigatório';
    END IF;

    v_company_type := UPPER(NULLIF(TRIM(COALESCE(meta->>'company_type','')), ''));
    IF v_company_type IS NULL OR v_company_type NOT IN ('IMOBILIARIA','CONSTRUTORA') THEN
      RAISE EXCEPTION 'Tipo de empresa (Imobiliária ou Construtora) é obrigatório';
    END IF;

    IF NULLIF(TRIM(COALESCE(meta->>'rt_name','')), '') IS NULL THEN
      RAISE EXCEPTION 'Nome do Responsável Técnico é obrigatório';
    END IF;
    IF NULLIF(TRIM(COALESCE(meta->>'rt_cpf','')), '') IS NULL THEN
      RAISE EXCEPTION 'CPF do Responsável Técnico é obrigatório';
    END IF;

    IF v_company_type = 'IMOBILIARIA' THEN
      IF NULLIF(TRIM(COALESCE(meta->>'creci_pj','')), '') IS NULL THEN
        RAISE EXCEPTION 'CRECI da imobiliária é obrigatório';
      END IF;
      IF NULLIF(TRIM(COALESCE(meta->>'creci_pj_uf','')), '') IS NULL THEN
        RAISE EXCEPTION 'UF do CRECI da imobiliária é obrigatória';
      END IF;
    ELSIF v_company_type = 'CONSTRUTORA' THEN
      IF NULLIF(TRIM(COALESCE(meta->>'crea_pj','')), '') IS NULL THEN
        RAISE EXCEPTION 'CREA da construtora é obrigatório';
      END IF;
      IF NULLIF(TRIM(COALESCE(meta->>'crea_pj_uf','')), '') IS NULL THEN
        RAISE EXCEPTION 'UF do CREA da construtora é obrigatória';
      END IF;
      IF NULLIF(TRIM(COALESCE(meta->>'rt_crea','')), '') IS NULL THEN
        RAISE EXCEPTION 'CREA do Responsável Técnico é obrigatório';
      END IF;
      IF NULLIF(TRIM(COALESCE(meta->>'rt_crea_uf','')), '') IS NULL THEN
        RAISE EXCEPTION 'UF do CREA do Responsável Técnico é obrigatória';
      END IF;
    END IF;
  END IF;
END;
$$;

-- Atualiza handle_new_user para validar antes de inserir o perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_input_code TEXT;
  v_conexao_plan_id UUID;
  v_conexao_credits INTEGER;
BEGIN
  -- Validação obrigatória de campos
  PERFORM public.validate_signup_metadata(NEW.raw_user_meta_data);

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
    true,
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
$$;