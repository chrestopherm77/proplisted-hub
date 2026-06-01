
-- Remove a policy permissiva demais que expunha dados de contato
DROP POLICY IF EXISTS "Anyone authenticated can see land searches (limited)" ON public.land_searches;

-- Restringe SELECT na base apenas a admin ou usuário com plano pago
CREATE POLICY "Admin or paid users see full land searches"
ON public.land_searches FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    has_role(auth.uid(), 'MASTER_ADMIN'::app_role)
    OR has_active_paid_plan(auth.uid())
  )
);

-- Recria a view com security_invoker = off (usa privilégios do dono)
-- para que free/anônimos consigam ler somente os campos seguros via view.
DROP VIEW IF EXISTS public.land_searches_public;

CREATE VIEW public.land_searches_public
WITH (security_invoker = off)
AS
SELECT
  id, company_name, min_area_m2, notes, logo_url,
  is_active, sort_order, created_at, updated_at
FROM public.land_searches
WHERE is_active = true;

GRANT SELECT ON public.land_searches_public TO anon, authenticated;
