
CREATE TABLE public.rental_partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  commission_text text,
  whatsapp_phone text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  owner_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_partners TO authenticated;
GRANT ALL ON public.rental_partners TO service_role;

ALTER TABLE public.rental_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view active partners"
ON public.rental_partners FOR SELECT TO authenticated
USING (is_active = true OR has_role(auth.uid(), 'MASTER_ADMIN'::app_role) OR auth.uid() = owner_user_id);

CREATE POLICY "Admins manage rental partners"
ON public.rental_partners FOR ALL TO authenticated
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE POLICY "Owner updates own partner"
ON public.rental_partners FOR UPDATE TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE TRIGGER update_rental_partners_updated_at
BEFORE UPDATE ON public.rental_partners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_rental_partners_city_state ON public.rental_partners (state, city) WHERE is_active = true;

-- Reserve the new slug in landing/video validators
CREATE OR REPLACE FUNCTION public.validate_landing_page_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  reserved TEXT[] := ARRAY[
    'admin','auth','leads','my-leads','cart','checkout','checkout-success',
    'checkout-error','checkout-expired','profile','lp','lp-01','lp-obrigado',
    'lp-obrigado-01','reset-password','property-searches','launches',
    'financiamento','giro-do-mercado','nossa-ia','comprar-creditos',
    'calculadora','criativos','portal-imoveis','imovel','planos','api',
    'assets','public','static','favicon.ico','robots.txt','sitemap.xml',
    'primeiros-passos','indicar','v','alugue-em-parceria'
  ];
BEGIN
  NEW.slug := lower(trim(NEW.slug));
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    RAISE EXCEPTION 'O slug não pode ser vazio';
  END IF;
  IF NOT NEW.slug ~ '^[a-z0-9][a-z0-9-]{0,59}$' THEN
    RAISE EXCEPTION 'Slug inválido. Use apenas letras minúsculas, números e hífens (sem acentos, sem espaços).';
  END IF;
  IF NEW.slug = ANY(reserved) THEN
    RAISE EXCEPTION 'Este slug é reservado pelo sistema. Escolha outro.';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_public_video_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  reserved TEXT[] := ARRAY[
    'admin','auth','leads','my-leads','cart','checkout','checkout-success',
    'checkout-error','checkout-expired','profile','lp','lp-01','lp-obrigado',
    'lp-obrigado-01','reset-password','property-searches','launches',
    'financiamento','giro-do-mercado','nossa-ia','comprar-creditos',
    'calculadora','criativos','portal-imoveis','imovel','planos','api',
    'assets','public','static','favicon.ico','robots.txt','sitemap.xml',
    'primeiros-passos','indicar','v','alugue-em-parceria'
  ];
BEGIN
  NEW.slug := lower(trim(NEW.slug));
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    RAISE EXCEPTION 'O slug não pode ser vazio';
  END IF;
  IF NOT NEW.slug ~ '^[a-z0-9][a-z0-9-]{0,59}$' THEN
    RAISE EXCEPTION 'Slug inválido. Use apenas letras minúsculas, números e hífens.';
  END IF;
  IF NEW.slug = ANY(reserved) THEN
    RAISE EXCEPTION 'Este slug é reservado pelo sistema. Escolha outro.';
  END IF;
  RETURN NEW;
END;
$function$;
