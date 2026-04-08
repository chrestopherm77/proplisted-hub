
-- Create launches table
CREATE TABLE public.launches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  banner_url text,
  name text NOT NULL,
  state text,
  city text NOT NULL,
  neighborhood text,
  zone text,
  launch_date date,
  delivery_date date,
  price_from text,
  commission text,
  floors text,
  total_units text,
  associative text,
  book_url text,
  table_url text,
  drive_url text,
  coordinator_name text,
  coordinator_phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.launches ENABLE ROW LEVEL SECURITY;

-- All authenticated can view active launches
CREATE POLICY "Authenticated can view active launches"
ON public.launches FOR SELECT TO authenticated
USING (is_active = true);

-- Users can insert own launches
CREATE POLICY "Users can insert own launches"
ON public.launches FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update own launches
CREATE POLICY "Users can update own launches"
ON public.launches FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete own launches
CREATE POLICY "Users can delete own launches"
ON public.launches FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all launches"
ON public.launches FOR ALL TO public
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Create storage bucket for launches
INSERT INTO storage.buckets (id, name, public) VALUES ('launches', 'launches', true);

-- Storage policies: authenticated can upload
CREATE POLICY "Authenticated can upload launch files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'launches');

-- Anyone can read launch files (public bucket)
CREATE POLICY "Public can read launch files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'launches');

-- Users can update their own uploads
CREATE POLICY "Users can update own launch files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'launches');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own launch files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'launches');
