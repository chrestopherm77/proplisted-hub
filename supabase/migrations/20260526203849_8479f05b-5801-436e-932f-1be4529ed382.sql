
CREATE TABLE public.lead_form_intentions (
  intention text PRIMARY KEY,
  label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lead_form_intentions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_form_intentions TO authenticated;
GRANT ALL ON public.lead_form_intentions TO service_role;

ALTER TABLE public.lead_form_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view intentions"
ON public.lead_form_intentions FOR SELECT
USING (true);

CREATE POLICY "Admins manage intentions"
ON public.lead_form_intentions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

INSERT INTO public.lead_form_intentions (intention, label, sort_order) VALUES
  ('SELL', 'Vender um imóvel', 1),
  ('BUY', 'Comprar um imóvel', 2),
  ('BUILD', 'Construir um imóvel', 3),
  ('RENT', 'Quero alugar um imóvel para mim', 4);
