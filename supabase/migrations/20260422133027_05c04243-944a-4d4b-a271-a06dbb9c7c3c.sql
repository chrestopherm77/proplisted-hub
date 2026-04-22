-- =============================================
-- PORTAL DE IMÓVEIS
-- =============================================

-- Tabela principal de imóveis
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reference_code TEXT NOT NULL UNIQUE,
  title TEXT,
  
  -- Tipo / operação
  property_type TEXT NOT NULL, -- APARTAMENTO, CASA, SOBRADO, COBERTURA, TERRENO, SALA_COMERCIAL, GALPAO, SITIO, CHACARA
  operation_type TEXT NOT NULL DEFAULT 'SALE', -- SALE, RENT, BOTH
  status TEXT, -- PRONTO, EM_CONSTRUCAO, REFORMADO, PRECISA_REFORMA
  
  -- Localização
  state TEXT,
  city TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT,
  
  -- Características
  bedrooms INTEGER,
  suites INTEGER,
  bathrooms INTEGER,
  parking_spots INTEGER,
  area_useful NUMERIC,
  area_total NUMERIC,
  
  -- Valores
  price_sale NUMERIC,
  price_rent NUMERIC,
  condo_fee NUMERIC,
  iptu NUMERIC,
  
  -- Extras
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  additional_info TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{url, order, is_cover}]
  
  -- Flags
  accept_affiliation BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_properties_is_active ON public.properties(is_active);
CREATE INDEX idx_properties_reference_code ON public.properties(reference_code);
CREATE INDEX idx_properties_city ON public.properties(city);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all properties"
  ON public.properties FOR ALL
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Tabela de afiliações
CREATE TABLE public.property_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  affiliate_user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, affiliate_user_id)
);

CREATE INDEX idx_property_affiliates_property_id ON public.property_affiliates(property_id);
CREATE INDEX idx_property_affiliates_user_id ON public.property_affiliates(affiliate_user_id);
CREATE INDEX idx_property_affiliates_token ON public.property_affiliates(token);

ALTER TABLE public.property_affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates view own affiliations"
  ON public.property_affiliates FOR SELECT
  TO authenticated
  USING (auth.uid() = affiliate_user_id);

CREATE POLICY "Property owners view their affiliates"
  ON public.property_affiliates FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_affiliates.property_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Admins view all affiliates"
  ON public.property_affiliates FOR SELECT
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE POLICY "Authenticated can create affiliate links"
  ON public.property_affiliates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = affiliate_user_id);

-- Tabela de visualizações (métricas)
CREATE TABLE public.property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  affiliate_id UUID,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_views_property_id ON public.property_views(property_id);

ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views"
  ON public.property_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Property owners can view stats"
  ON public.property_views FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_views.property_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all stats"
  ON public.property_views FOR SELECT
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger updated_at
CREATE TRIGGER trg_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar reference_code (A0001, A0002, ...)
CREATE OR REPLACE FUNCTION public.generate_property_reference_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.reference_code IS NULL OR NEW.reference_code = '' THEN
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(reference_code FROM 2) AS INTEGER)),
      0
    ) + 1 INTO next_num
    FROM public.properties
    WHERE reference_code ~ '^A[0-9]+$';
    
    NEW.reference_code := 'A' || LPAD(next_num::text, 4, '0');
  END IF;
  
  -- Auto-gerar título se vazio
  IF NEW.title IS NULL OR NEW.title = '' THEN
    NEW.title := COALESCE(INITCAP(REPLACE(NEW.property_type, '_', ' ')), '') 
              || CASE WHEN NEW.neighborhood IS NOT NULL THEN ' ' || NEW.neighborhood ELSE '' END;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_properties_reference_code
BEFORE INSERT ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.generate_property_reference_code();

-- =============================================
-- FUNÇÃO PÚBLICA: get_public_property
-- =============================================
CREATE OR REPLACE FUNCTION public.get_public_property(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property RECORD;
  v_owner RECORD;
  v_affiliate RECORD;
  v_contact_user_id UUID;
  v_token TEXT;
  v_ref TEXT;
  v_dash_pos INTEGER;
BEGIN
  -- Slug pode ser "A0447" (link do dono) ou "A0447-aff-{token}" (link de afiliado)
  IF p_slug ~ '-aff-' THEN
    v_dash_pos := POSITION('-aff-' IN p_slug);
    v_ref := SUBSTRING(p_slug FROM 1 FOR v_dash_pos - 1);
    v_token := SUBSTRING(p_slug FROM v_dash_pos + 5);
  ELSE
    v_ref := p_slug;
    v_token := NULL;
  END IF;

  SELECT * INTO v_property
  FROM public.properties
  WHERE reference_code = v_ref AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Determinar contato a exibir
  v_contact_user_id := v_property.user_id;
  
  IF v_token IS NOT NULL THEN
    SELECT * INTO v_affiliate
    FROM public.property_affiliates
    WHERE token = v_token AND property_id = v_property.id;
    
    IF FOUND THEN
      v_contact_user_id := v_affiliate.affiliate_user_id;
    END IF;
  END IF;

  SELECT name, phone, creci_number, creci, creci_uf, company_name, profession
  INTO v_owner
  FROM public.profiles
  WHERE id = v_contact_user_id;

  RETURN jsonb_build_object(
    'id', v_property.id,
    'reference_code', v_property.reference_code,
    'title', v_property.title,
    'property_type', v_property.property_type,
    'operation_type', v_property.operation_type,
    'status', v_property.status,
    'state', v_property.state,
    'city', v_property.city,
    'neighborhood', v_property.neighborhood,
    'address', v_property.address,
    'bedrooms', v_property.bedrooms,
    'suites', v_property.suites,
    'bathrooms', v_property.bathrooms,
    'parking_spots', v_property.parking_spots,
    'area_useful', v_property.area_useful,
    'area_total', v_property.area_total,
    'price_sale', v_property.price_sale,
    'price_rent', v_property.price_rent,
    'condo_fee', v_property.condo_fee,
    'iptu', v_property.iptu,
    'amenities', v_property.amenities,
    'additional_info', v_property.additional_info,
    'photos', v_property.photos,
    'is_affiliate_view', v_token IS NOT NULL,
    'contact', jsonb_build_object(
      'name', COALESCE(v_owner.name, v_owner.company_name),
      'phone', v_owner.phone,
      'creci', COALESCE(v_owner.creci_number, v_owner.creci),
      'creci_uf', v_owner.creci_uf,
      'profession', v_owner.profession
    )
  );
END;
$$;

-- =============================================
-- BUCKET DE STORAGE
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Property photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'properties');

CREATE POLICY "Users can upload property photos to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'properties'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own property photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'properties'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own property photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'properties'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );