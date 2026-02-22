
-- Function to check phone limit (trigger)
CREATE OR REPLACE FUNCTION public.check_phone_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  phone_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO phone_count
  FROM public.profiles
  WHERE regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  
  IF phone_count >= 2 THEN
    RAISE EXCEPTION 'Este telefone já possui o limite máximo de contas cadastradas (2).';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger BEFORE INSERT
CREATE TRIGGER enforce_phone_limit
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_phone_limit();

-- RPC function for frontend check (accessible without auth)
CREATE OR REPLACE FUNCTION public.check_phone_availability(p_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  phone_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO phone_count
  FROM public.profiles
  WHERE regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  RETURN phone_count < 2;
END;
$$;
