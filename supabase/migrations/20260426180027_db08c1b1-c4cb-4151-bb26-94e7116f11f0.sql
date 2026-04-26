-- Tabela de Landing Pages customizadas
CREATE TABLE public.custom_landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'Nova Landing Page',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  theme JSONB NOT NULL DEFAULT '{
    "primary": "#2563eb",
    "secondary": "#1e40af",
    "background": "#ffffff",
    "text": "#0f172a",
    "accent": "#22c55e"
  }'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_landing_pages_slug ON public.custom_landing_pages(slug);
CREATE INDEX idx_custom_landing_pages_published ON public.custom_landing_pages(is_published);

-- Função de validação de slug (formato + reservados)
CREATE OR REPLACE FUNCTION public.validate_landing_page_slug()
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
    'assets','public','static','favicon.ico','robots.txt','sitemap.xml'
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
$$;

CREATE TRIGGER trg_validate_landing_page_slug
BEFORE INSERT OR UPDATE OF slug ON public.custom_landing_pages
FOR EACH ROW EXECUTE FUNCTION public.validate_landing_page_slug();

-- Trigger updated_at
CREATE TRIGGER trg_custom_landing_pages_updated_at
BEFORE UPDATE ON public.custom_landing_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.custom_landing_pages ENABLE ROW LEVEL SECURITY;

-- Público pode ver LPs publicadas
CREATE POLICY "Public can view published landing pages"
ON public.custom_landing_pages
FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Admin pode ver todas (inclusive rascunhos)
CREATE POLICY "Admins can view all landing pages"
ON public.custom_landing_pages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- Admin pode criar
CREATE POLICY "Admins can insert landing pages"
ON public.custom_landing_pages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- Admin pode atualizar
CREATE POLICY "Admins can update landing pages"
ON public.custom_landing_pages
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- Admin pode excluir
CREATE POLICY "Admins can delete landing pages"
ON public.custom_landing_pages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- Bucket de mídia para LPs
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-pages', 'landing-pages', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can read landing-pages bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'landing-pages');

CREATE POLICY "Admins can upload to landing-pages bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'landing-pages'
  AND public.has_role(auth.uid(), 'MASTER_ADMIN')
);

CREATE POLICY "Admins can update landing-pages bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'landing-pages'
  AND public.has_role(auth.uid(), 'MASTER_ADMIN')
);

CREATE POLICY "Admins can delete from landing-pages bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'landing-pages'
  AND public.has_role(auth.uid(), 'MASTER_ADMIN')
);