-- Adicionar novos campos à tabela profiles para suportar PF e PJ

-- Tipo de pessoa
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS person_type TEXT;

-- Campos comuns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- Campos específicos PJ
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creci_pj TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creci_pj_uf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crea_pj TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crea_pj_uf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rt_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rt_cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rt_crea TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rt_crea_uf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rt_cau TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rt_cau_uf TEXT;

-- Campos específicos PF
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creci TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creci_uf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cau TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cau_uf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crea TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crea_uf TEXT;

-- Tornar campo creci_number opcional (mantendo para compatibilidade)
ALTER TABLE public.profiles ALTER COLUMN creci_number DROP NOT NULL;

-- Atualizar a função handle_new_user para suportar os novos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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