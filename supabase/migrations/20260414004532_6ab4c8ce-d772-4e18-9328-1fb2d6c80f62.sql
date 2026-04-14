CREATE POLICY "Authenticated can view all offers"
  ON public.property_search_offers
  FOR SELECT TO authenticated
  USING (true);