-- 1) Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS referral_credits_granted BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- 2) Helper function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_attempts INTEGER := 0;
BEGIN
  LOOP
    v_code := UPPER(SUBSTRING(MD5(random()::text || clock_timestamp()::text) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists OR v_attempts > 20;
    v_attempts := v_attempts + 1;
  END LOOP;
  RETURN v_code;
END;
$$;

-- 3) Backfill existing profiles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE referral_code IS NULL LOOP
    UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE id = r.id;
  END LOOP;
END $$;

-- 4) Update handle_new_user to generate referral_code and capture referred_by from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id UUID;
  v_input_code TEXT;
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

  RETURN NEW;
END;
$function$;

-- 5) Function to redeem referral and grant 280 credits
CREATE OR REPLACE FUNCTION public.redeem_referral(p_user_id UUID, p_referral_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_referrer_id UUID;
  v_code TEXT;
BEGIN
  v_code := UPPER(TRIM(COALESCE(p_referral_code, '')));
  IF v_code = '' THEN
    RETURN jsonb_build_object('error', 'Código de indicação inválido');
  END IF;

  -- Lock user profile
  SELECT * INTO v_user FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Perfil não encontrado');
  END IF;

  IF v_user.referral_credits_granted = true OR v_user.referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Indicação já registrada para este usuário');
  END IF;

  -- Find referrer
  SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_code LIMIT 1;
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Código de indicação não encontrado');
  END IF;

  IF v_referrer_id = p_user_id THEN
    RETURN jsonb_build_object('error', 'Você não pode usar seu próprio código');
  END IF;

  -- Mark new user as referred
  UPDATE public.profiles
    SET referred_by = v_referrer_id, referral_credits_granted = true
    WHERE id = p_user_id;

  -- Credit referrer
  UPDATE public.profiles
    SET credit_balance = credit_balance + 280
    WHERE id = v_referrer_id;

  INSERT INTO public.credit_transactions (user_id, lead_id, credits_used, type)
  VALUES (v_referrer_id, NULL, 280, 'REFERRAL_BONUS');

  RETURN jsonb_build_object('success', true, 'message', 'Indicação registrada com sucesso!');
END;
$$;