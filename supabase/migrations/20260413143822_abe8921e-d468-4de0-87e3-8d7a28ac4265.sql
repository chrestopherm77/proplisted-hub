-- Add columns to property_search_offers
ALTER TABLE public.property_search_offers
  ADD COLUMN IF NOT EXISTS offer_link text,
  ADD COLUMN IF NOT EXISTS offer_name text;

-- Allow search owners to view offers on their searches
CREATE POLICY "Search owners can view offers on their searches"
  ON public.property_search_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.property_searches ps
      WHERE ps.id = property_search_offers.search_id
        AND ps.user_id = auth.uid()
    )
  );

-- Create property_search_alerts table
CREATE TABLE public.property_search_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filters jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.property_search_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
  ON public.property_search_alerts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all alerts"
  ON public.property_search_alerts
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));