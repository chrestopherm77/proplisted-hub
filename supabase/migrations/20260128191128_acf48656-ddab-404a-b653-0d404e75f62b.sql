-- =====================================================
-- Correção de Segurança: Remover políticas RLS perigosas
-- =====================================================

-- WHATSAPP VERIFICATION CODES
-- Remover SELECT público (dados sensíveis expostos)
DROP POLICY IF EXISTS "Allow public select" ON whatsapp_verification_codes;

-- Remover UPDATE público (permite bypass de verificação)
DROP POLICY IF EXISTS "Allow public update" ON whatsapp_verification_codes;

-- EMAIL VERIFICATION CODES
-- Remover SELECT público (dados sensíveis expostos)
DROP POLICY IF EXISTS "Allow public select for email verification" ON email_verification_codes;

-- Remover UPDATE público (permite bypass de verificação)
DROP POLICY IF EXISTS "Allow public update for email verification" ON email_verification_codes;

-- =====================================================
-- Correção: search_path da função handle_new_user
-- =====================================================

-- Recriar função com sintaxe correta (= ao invés de TO)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    phone, 
    creci_number, 
    accepted_terms,
    person_type,
    cpf,
    address,
    company_name,
    cnpj,
    company_type,
    creci_pj,
    creci_pj_uf,
    crea_pj,
    crea_pj_uf,
    rt_name,
    rt_cpf,
    rt_crea,
    rt_crea_uf,
    rt_cau,
    rt_cau_uf,
    profession,
    creci,
    creci_uf,
    cau,
    cau_uf,
    crea,
    crea_uf
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'company_name'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'creci_number',
    COALESCE((NEW.raw_user_meta_data->>'accepted_terms')::BOOLEAN, false),
    NEW.raw_user_meta_data->>'person_type',
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'address',
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
    NEW.raw_user_meta_data->>'crea_uf'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'USER');
  
  RETURN NEW;
END;
$function$;