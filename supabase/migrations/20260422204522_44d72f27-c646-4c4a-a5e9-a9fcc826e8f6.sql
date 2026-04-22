-- 1. Tabela de fila de geocoding
CREATE TABLE IF NOT EXISTS public.pending_geocodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_geocodes_attempts ON public.pending_geocodes(attempts);

ALTER TABLE public.pending_geocodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pending_geocodes"
  ON public.pending_geocodes
  FOR ALL
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- 2. Trigger function: enfileira quando latitude é nula
CREATE OR REPLACE FUNCTION public.enqueue_property_geocode()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    INSERT INTO public.pending_geocodes (property_id)
    VALUES (NEW.id)
    ON CONFLICT (property_id) DO UPDATE
      SET updated_at = now();
  ELSE
    -- Já tem coordenadas: remove da fila se estava lá
    DELETE FROM public.pending_geocodes WHERE property_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger no properties
DROP TRIGGER IF EXISTS properties_enqueue_geocode ON public.properties;
CREATE TRIGGER properties_enqueue_geocode
AFTER INSERT OR UPDATE OF latitude, longitude, address, neighborhood, city, state ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_property_geocode();

-- 4. Backfill da fila com imóveis ativos sem coordenadas
INSERT INTO public.pending_geocodes (property_id)
SELECT id FROM public.properties
WHERE is_active = true AND (latitude IS NULL OR longitude IS NULL)
ON CONFLICT (property_id) DO NOTHING;