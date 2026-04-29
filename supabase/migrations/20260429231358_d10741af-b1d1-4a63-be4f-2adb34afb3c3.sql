
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- Wrapper IMMUTABLE para usar em índice
CREATE OR REPLACE FUNCTION public.immutable_unaccent_lower(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT lower(public.unaccent('public.unaccent', coalesce(p, '')));
$$;

CREATE TABLE public.whatsapp_city_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_jid text NOT NULL,
  group_label text NOT NULL,
  city text NOT NULL,
  uf text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_city_groups_jid_check CHECK (group_jid ~ '@g\.us$'),
  CONSTRAINT whatsapp_city_groups_uf_check CHECK (char_length(uf) = 2)
);

CREATE UNIQUE INDEX whatsapp_city_groups_unique
  ON public.whatsapp_city_groups (group_jid, public.immutable_unaccent_lower(city), upper(uf));

CREATE INDEX whatsapp_city_groups_city_idx
  ON public.whatsapp_city_groups (public.immutable_unaccent_lower(city), upper(uf))
  WHERE is_active = true;

ALTER TABLE public.whatsapp_city_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp_city_groups"
  ON public.whatsapp_city_groups
  FOR ALL
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE TRIGGER whatsapp_city_groups_set_updated_at
  BEFORE UPDATE ON public.whatsapp_city_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_groups_for_city(p_city text, p_uf text)
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT group_jid), ARRAY[]::text[])
  FROM public.whatsapp_city_groups
  WHERE is_active = true
    AND p_city IS NOT NULL
    AND p_uf IS NOT NULL
    AND public.immutable_unaccent_lower(city) = public.immutable_unaccent_lower(trim(p_city))
    AND upper(uf) = upper(trim(p_uf));
$$;

INSERT INTO public.whatsapp_city_groups (group_jid, group_label, city, uf) VALUES
  ('120363407964054463@g.us', 'Ribeirão Preto - Grupo 1', 'Ribeirão Preto', 'SP'),
  ('120363426047592689@g.us', 'Ribeirão Preto - Grupo 2', 'Ribeirão Preto', 'SP'),
  ('120363410244397205@g.us', 'Ribeirão Preto - Grupo 3', 'Ribeirão Preto', 'SP'),
  ('120363409744685071@g.us', 'MG Histórico', 'Tiradentes', 'MG'),
  ('120363409744685071@g.us', 'MG Histórico', 'Barbacena', 'MG'),
  ('120363409744685071@g.us', 'MG Histórico', 'São João del Rei', 'MG');
