-- 1. Adicionar colunas de controle de perfil completo
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_completion_reminder_at timestamptz;

-- 2. Marcar usuários antigos com cadastro completo
UPDATE public.profiles
SET profile_completed = true
WHERE profile_completed = false
  AND accepted_terms = true
  AND address IS NOT NULL AND length(trim(address)) > 0
  AND address_uf IS NOT NULL AND length(trim(address_uf)) > 0
  AND address_city IS NOT NULL AND length(trim(address_city)) > 0
  AND (
    (person_type = 'PF' AND cpf IS NOT NULL AND length(trim(cpf)) > 0)
    OR
    (person_type = 'PJ' AND cnpj IS NOT NULL AND length(trim(cnpj)) > 0)
  );

-- 3. Relaxar validate_signup_metadata: só exige basics no signup
CREATE OR REPLACE FUNCTION public.validate_signup_metadata(meta jsonb)
 RETURNS void
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_person_type text;
BEGIN
  IF meta IS NULL THEN
    RAISE EXCEPTION 'Dados do cadastro ausentes';
  END IF;

  -- Telefone obrigatório (mantido para regras de limite)
  IF NULLIF(TRIM(COALESCE(meta->>'phone','')), '') IS NULL THEN
    RAISE EXCEPTION 'Telefone é obrigatório';
  END IF;

  -- Tipo de pessoa obrigatório (default PF é responsabilidade do app)
  v_person_type := UPPER(NULLIF(TRIM(COALESCE(meta->>'person_type','')), ''));
  IF v_person_type IS NULL OR v_person_type NOT IN ('PF', 'PJ') THEN
    RAISE EXCEPTION 'Tipo de pessoa (PF ou PJ) é obrigatório';
  END IF;

  -- Nome obrigatório (PF: name; PJ: company_name OU name)
  IF v_person_type = 'PF' THEN
    IF NULLIF(TRIM(COALESCE(meta->>'name','')), '') IS NULL THEN
      RAISE EXCEPTION 'Nome completo é obrigatório';
    END IF;
  ELSE
    IF NULLIF(TRIM(COALESCE(meta->>'company_name','')), '') IS NULL
       AND NULLIF(TRIM(COALESCE(meta->>'name','')), '') IS NULL THEN
      RAISE EXCEPTION 'Nome é obrigatório';
    END IF;
  END IF;
END;
$function$;

-- 4. Função para marcar perfil como completo (validando os campos)
CREATE OR REPLACE FUNCTION public.mark_profile_complete(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile record;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Perfil não encontrado');
  END IF;

  -- Endereço
  IF v_profile.address IS NULL OR length(trim(v_profile.address)) = 0
     OR v_profile.address_uf IS NULL OR length(trim(v_profile.address_uf)) = 0
     OR v_profile.address_city IS NULL OR length(trim(v_profile.address_city)) = 0
     OR v_profile.address_neighborhood IS NULL OR length(trim(v_profile.address_neighborhood)) = 0 THEN
    RETURN jsonb_build_object('error', 'Endereço incompleto');
  END IF;

  -- Termos
  IF v_profile.accepted_terms IS NOT TRUE THEN
    RETURN jsonb_build_object('error', 'Termos não aceitos');
  END IF;

  -- PF/PJ
  IF v_profile.person_type = 'PF' THEN
    IF v_profile.cpf IS NULL OR length(trim(v_profile.cpf)) = 0 THEN
      RETURN jsonb_build_object('error', 'CPF é obrigatório');
    END IF;
  ELSIF v_profile.person_type = 'PJ' THEN
    IF v_profile.cnpj IS NULL OR length(trim(v_profile.cnpj)) = 0 THEN
      RETURN jsonb_build_object('error', 'CNPJ é obrigatório');
    END IF;
  ELSE
    RETURN jsonb_build_object('error', 'Tipo de pessoa não definido');
  END IF;

  UPDATE public.profiles
    SET profile_completed = true,
        updated_at = now()
    WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- 5. Função para registrar que o lembrete foi mostrado
CREATE OR REPLACE FUNCTION public.touch_completion_reminder(p_user_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.profiles
    SET last_completion_reminder_at = now()
    WHERE id = p_user_id;
$function$;