CREATE OR REPLACE FUNCTION public.get_groups_for_city(p_city text, p_uf text)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT group_jid), ARRAY[]::text[])
  FROM public.whatsapp_city_groups
  WHERE is_active = true
    AND p_city IS NOT NULL
    AND btrim(p_city) <> ''
    AND public.immutable_unaccent_lower(city) = public.immutable_unaccent_lower(trim(p_city))
    AND (p_uf IS NULL OR btrim(p_uf) = '' OR upper(uf) = upper(trim(p_uf)));
$$;