
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  location_name TEXT,
  external_url TEXT NOT NULL,
  cover_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active events"
  ON public.events FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins manage events"
  ON public.events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- Permite admin gerenciar via tabela
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_state_city ON public.events(state, city);
