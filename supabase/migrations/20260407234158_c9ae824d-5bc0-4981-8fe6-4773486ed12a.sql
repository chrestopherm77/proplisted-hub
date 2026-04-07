
CREATE TABLE public.property_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_type text NOT NULL,
  operation_type text NOT NULL,
  city text NOT NULL,
  neighborhood text,
  zone text,
  size_m2 text,
  bedrooms text,
  value text,
  parking_spots text,
  observation text,
  house_type text,
  rural_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.property_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active searches"
ON public.property_searches FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Users can insert own searches"
ON public.property_searches FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own searches"
ON public.property_searches FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own searches"
ON public.property_searches FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all searches"
ON public.property_searches FOR ALL TO public
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));
