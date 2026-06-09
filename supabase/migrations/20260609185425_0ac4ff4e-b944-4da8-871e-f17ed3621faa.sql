CREATE OR REPLACE FUNCTION public.get_lead_buyers(p_lead_id uuid)
 RETURNS TABLE(user_id uuid, buyer_name text, purchased_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT pu.user_id,
         COALESCE(NULLIF(TRIM(pr.company_name), ''), NULLIF(TRIM(pr.name), ''), 'Corretor') AS buyer_name,
         pu.purchased_at
  FROM public.purchases pu
  LEFT JOIN public.profiles pr ON pr.id = pu.user_id
  WHERE pu.lead_id = p_lead_id
    AND pu.status = 'PAID'
    AND NOT public.has_role(pu.user_id, 'MASTER_ADMIN')
  ORDER BY pu.purchased_at ASC;
$function$;