-- Tabela de vídeos com link público
CREATE TABLE public.public_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL DEFAULT 'url' CHECK (video_type IN ('url','mp4')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_public_videos_slug ON public.public_videos(slug);

ALTER TABLE public.public_videos ENABLE ROW LEVEL SECURITY;

-- Público (sem login) pode ver os ativos
CREATE POLICY "Public can view active public videos"
ON public.public_videos
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admin pode tudo
CREATE POLICY "Admins manage public videos"
ON public.public_videos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Trigger updated_at
CREATE TRIGGER trg_public_videos_updated_at
BEFORE UPDATE ON public.public_videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validação de slug e bloqueio dos reservados
CREATE OR REPLACE FUNCTION public.validate_public_video_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  reserved TEXT[] := ARRAY[
    'admin','auth','leads','my-leads','cart','checkout','checkout-success',
    'checkout-error','checkout-expired','profile','lp','lp-01','lp-obrigado',
    'lp-obrigado-01','reset-password','property-searches','launches',
    'financiamento','giro-do-mercado','nossa-ia','comprar-creditos',
    'calculadora','criativos','portal-imoveis','imovel','planos','api',
    'assets','public','static','favicon.ico','robots.txt','sitemap.xml',
    'primeiros-passos','indicar','v'
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
$$;

CREATE TRIGGER trg_public_videos_validate_slug
BEFORE INSERT OR UPDATE OF slug ON public.public_videos
FOR EACH ROW EXECUTE FUNCTION public.validate_public_video_slug();

-- Função pública para incrementar visualizações
CREATE OR REPLACE FUNCTION public.increment_public_video_view(p_slug TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.public_videos
  SET view_count = view_count + 1
  WHERE slug = p_slug AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.increment_public_video_view(TEXT) TO anon, authenticated;

-- Reservar 'v' no validador de landing pages para evitar conflito com /v/:slug
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
    'primeiros-passos','indicar','v'
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