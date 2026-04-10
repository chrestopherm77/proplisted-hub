
ALTER TABLE public.property_searches ADD COLUMN headline text;

CREATE TABLE public.property_search_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid NOT NULL REFERENCES public.property_searches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(search_id, user_id)
);

ALTER TABLE public.property_search_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offers"
ON public.property_search_offers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offers"
ON public.property_search_offers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all offers"
ON public.property_search_offers
FOR ALL
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));
