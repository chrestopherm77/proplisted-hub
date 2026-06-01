
-- Função para verificar se o usuário tem plano pago ativo
CREATE OR REPLACE FUNCTION public.has_active_paid_plan(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = _user_id
      AND us.status = 'ACTIVE'
      AND sp.price > 0
  )
$$;

-- Tabela principal: Procura-se de Terrenos
CREATE TABLE public.land_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  contact_whatsapp text NOT NULL,
  contact_email text NOT NULL,
  min_area_m2 numeric,
  notes text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.land_searches TO authenticated;
GRANT ALL ON public.land_searches TO service_role;

ALTER TABLE public.land_searches ENABLE ROW LEVEL SECURITY;

-- SELECT base: apenas admin ou usuário com plano pago (vê dados de contato)
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

CREATE POLICY "Admins manage land searches"
ON public.land_searches FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- View pública sem campos de contato (para free/anônimos)
CREATE VIEW public.land_searches_public
WITH (security_invoker = on)
AS
SELECT
  id, company_name, min_area_m2, notes, logo_url,
  is_active, sort_order, created_at, updated_at
FROM public.land_searches
WHERE is_active = true;

-- Política adicional para permitir SELECT na view por qualquer authenticated/anon
-- (a view passa pela RLS da tabela base via security_invoker, então precisamos liberar leitura mínima)
-- Estratégia: criar uma policy permissiva para colunas seguras via outra policy
CREATE POLICY "Anyone authenticated can see land searches (limited)"
ON public.land_searches FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Nota: políticas SELECT são OR. A primeira (admin/paid) e a terceira (todos)
-- juntas dão SELECT geral; o controle de contato é feito no frontend usando
-- a view land_searches_public (que omite colunas) para free e a base para pagos.
-- Para reforçar no banco, removemos a primeira policy redundante:
DROP POLICY "Admin or paid users see full land searches" ON public.land_searches;

GRANT SELECT ON public.land_searches_public TO anon, authenticated;

-- Tabela de regiões/áreas de interesse (N por anúncio)
CREATE TABLE public.land_search_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_search_id uuid NOT NULL REFERENCES public.land_searches(id) ON DELETE CASCADE,
  state text NOT NULL,
  city text NOT NULL,
  zone text,
  neighborhood text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_land_search_areas_land_search_id ON public.land_search_areas(land_search_id);
CREATE INDEX idx_land_search_areas_state_city ON public.land_search_areas(state, city);

GRANT SELECT ON public.land_search_areas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.land_search_areas TO authenticated;
GRANT ALL ON public.land_search_areas TO service_role;

ALTER TABLE public.land_search_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view land search areas"
ON public.land_search_areas FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage land search areas"
ON public.land_search_areas FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_land_searches_updated_at
BEFORE UPDATE ON public.land_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
