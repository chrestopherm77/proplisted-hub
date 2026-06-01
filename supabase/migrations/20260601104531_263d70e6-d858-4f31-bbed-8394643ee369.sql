
DROP VIEW IF EXISTS public.land_searches_public;

CREATE OR REPLACE FUNCTION public.list_land_searches_public()
RETURNS TABLE (
  id uuid,
  company_name text,
  min_area_m2 numeric,
  notes text,
  logo_url text,
  sort_order integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, company_name, min_area_m2, notes, logo_url, sort_order, created_at
  FROM public.land_searches
  WHERE is_active = true
  ORDER BY sort_order ASC, created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.list_land_searches_public() TO anon, authenticated;

-- Garante search_path na função has_active_paid_plan (já criada com search_path, ok)
