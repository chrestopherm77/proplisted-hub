
-- Tabela de estilos de criativos (gerenciada pelo admin)
CREATE TABLE public.creative_styles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active styles"
ON public.creative_styles FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage styles"
ON public.creative_styles FOR ALL
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE TRIGGER update_creative_styles_updated_at
BEFORE UPDATE ON public.creative_styles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de marcas dos usuários
CREATE TABLE public.user_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own brand"
ON public.user_brands FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all brands"
ON public.user_brands FOR SELECT
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE TRIGGER update_user_brands_updated_at
BEFORE UPDATE ON public.user_brands
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de criativos gerados
CREATE TABLE public.creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  style_slug TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('POST','STORIES','TRAFEGO')),
  info_text TEXT,
  main_image_url TEXT,
  mockup_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','READY','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_creatives_user_id ON public.creatives(user_id);
CREATE INDEX idx_creatives_created_at ON public.creatives(created_at DESC);

ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own creatives"
ON public.creatives FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all creatives"
ON public.creatives FOR SELECT
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Seed dos 7 estilos
INSERT INTO public.creative_styles (slug, name, description) VALUES
  ('praia', 'Praia', 'Imóveis litorâneos e costeiros'),
  ('campo', 'Campo / Chácara', 'Imóveis rurais e sítios'),
  ('comercial', 'Comercial', 'Salas comerciais e pontos de negócio'),
  ('centro', 'Centro / Urbano', 'Imóveis em região central e urbana'),
  ('luxo', 'Imóvel de Luxo', 'Propriedades de alto padrão e sofisticadas'),
  ('lancamento', 'Lançamento', 'Empreendimentos novos em pré-venda'),
  ('lotes', 'Vendas de lotes', 'Venda de lotes e chácaras');

-- Buckets de storage
INSERT INTO storage.buckets (id, name, public) VALUES
  ('brand-logos', 'brand-logos', true),
  ('creatives', 'creatives', true);

-- RLS de storage: brand-logos
CREATE POLICY "Brand logos publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

CREATE POLICY "Users upload own brand logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own brand logo"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own brand logo"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'brand-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS de storage: creatives
CREATE POLICY "Creatives publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'creatives');

CREATE POLICY "Users upload own creatives"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own creatives"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own creatives"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);
