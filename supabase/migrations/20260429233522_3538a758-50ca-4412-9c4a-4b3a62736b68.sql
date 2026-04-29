ALTER TABLE public.whatsapp_city_groups ADD COLUMN IF NOT EXISTS invite_url text;

CREATE OR REPLACE FUNCTION public.get_invite_url_for_city(p_city text, p_uf text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT invite_url
  FROM public.whatsapp_city_groups
  WHERE is_active = true
    AND invite_url IS NOT NULL
    AND invite_url <> ''
    AND p_city IS NOT NULL
    AND p_uf IS NOT NULL
    AND public.immutable_unaccent_lower(city) = public.immutable_unaccent_lower(trim(p_city))
    AND upper(uf) = upper(trim(p_uf))
  LIMIT 1;
$function$;