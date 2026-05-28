
CREATE TABLE public.financing_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  property_value TEXT,
  down_payment TEXT,
  term TEXT,
  monthly_income TEXT,
  modality TEXT,
  notes TEXT,
  source TEXT DEFAULT 'conectaeimob-portal',
  status TEXT NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financing_leads TO authenticated;
GRANT INSERT ON public.financing_leads TO anon;
GRANT ALL ON public.financing_leads TO service_role;

ALTER TABLE public.financing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit financing requests"
ON public.financing_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view financing leads"
ON public.financing_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins can update financing leads"
ON public.financing_leads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins can delete financing leads"
ON public.financing_leads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE TRIGGER update_financing_leads_updated_at
BEFORE UPDATE ON public.financing_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_financing_leads_created_at ON public.financing_leads (created_at DESC);
