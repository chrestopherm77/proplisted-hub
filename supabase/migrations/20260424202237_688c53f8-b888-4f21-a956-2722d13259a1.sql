DROP POLICY IF EXISTS "Allow update only by matching session" ON public.lp_partial_leads;

CREATE POLICY "Allow anonymous update of own session row"
  ON public.lp_partial_leads
  FOR UPDATE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '')
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');