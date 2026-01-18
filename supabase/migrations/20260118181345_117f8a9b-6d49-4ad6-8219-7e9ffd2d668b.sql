-- Allow both anonymous and logged-in users to submit the public /lp form

-- lead_submissions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lead_submissions'
      AND policyname = 'Allow anonymous insert'
  ) THEN
    EXECUTE 'ALTER POLICY "Allow anonymous insert" ON public.lead_submissions TO anon, authenticated';
  ELSE
    EXECUTE 'CREATE POLICY "Allow anonymous insert" ON public.lead_submissions FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;
END $$;

-- leads
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'leads'
      AND policyname = 'Allow public insert from form'
  ) THEN
    EXECUTE 'ALTER POLICY "Allow public insert from form" ON public.leads TO anon, authenticated';
  ELSE
    EXECUTE 'CREATE POLICY "Allow public insert from form" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;
END $$;