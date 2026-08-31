DROP FUNCTION IF EXISTS public.list_land_searches_public();

CREATE OR REPLACE FUNCTION public.list_land_searches_public()
RETURNS TABLE(id uuid, company_name text, min_area_m2 numeric, notes text, logo_url text, sort_order integer, created_at timestamptz, payment_methods text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, company_name, min_area_m2, notes, logo_url, sort_order, created_at, payment_methods
  FROM public.land_searches
  WHERE is_active = true
  ORDER BY sort_order ASC, created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_land_searches_public() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_land_searches_public() TO anon, authenticated;