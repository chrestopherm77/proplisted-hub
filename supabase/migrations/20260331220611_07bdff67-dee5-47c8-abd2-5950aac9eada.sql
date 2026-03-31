
ALTER TABLE public.leads ADD COLUMN is_exhausted boolean DEFAULT false;

CREATE POLICY "Anyone authenticated can view exhausted leads"
ON public.leads
FOR SELECT
TO authenticated
USING (is_exhausted = true);
