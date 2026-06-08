CREATE OR REPLACE FUNCTION public.get_lead_buyers(p_lead_id uuid)
RETURNS TABLE(user_id uuid, buyer_name text, purchased_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pu.user_id,
         COALESCE(NULLIF(TRIM(pr.company_name), ''), NULLIF(TRIM(pr.name), ''), 'Corretor') AS buyer_name,
         pu.purchased_at
  FROM public.purchases pu
  LEFT JOIN public.profiles pr ON pr.id = pu.user_id
  WHERE pu.lead_id = p_lead_id
    AND pu.status = 'PAID'
  ORDER BY pu.purchased_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_lead_buyers(uuid) TO authenticated;