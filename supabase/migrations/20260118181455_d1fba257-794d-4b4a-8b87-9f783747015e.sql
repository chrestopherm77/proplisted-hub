-- Tighten public INSERT policies to avoid overly permissive WITH CHECK (true)

-- lead_submissions: accept only minimally valid payloads
ALTER POLICY "Allow anonymous insert" ON public.lead_submissions
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(phone)) > 0
    AND intention IN ('SELL','BUY','BUILD','RENT')
  );

-- leads: accept only minimally valid marketplace lead rows from the form
ALTER POLICY "Allow public insert from form" ON public.leads
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(phone)) > 0
    AND length(trim(description)) > 0
    AND price > 0
    AND lead_submission_id IS NOT NULL
  );