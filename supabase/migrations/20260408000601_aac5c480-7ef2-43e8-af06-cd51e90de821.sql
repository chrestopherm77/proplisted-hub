
ALTER TABLE public.property_searches ADD COLUMN state text;
ALTER TABLE public.property_searches ADD COLUMN offer_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.get_profile_phone(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.profiles WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_offer_count(p_search_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.property_searches
  SET offer_count = offer_count + 1
  WHERE id = p_search_id;
END;
$$;
