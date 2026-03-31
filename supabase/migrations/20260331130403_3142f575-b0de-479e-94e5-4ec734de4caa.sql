
-- Create partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  custom_domain text UNIQUE,
  logo_url text,
  primary_color text DEFAULT '#1e40af',
  secondary_color text DEFAULT '#3b82f6',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Admin can manage all partners
CREATE POLICY "Admins can manage partners"
  ON public.partners FOR ALL
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Public can read active partners by domain (for detection)
CREATE POLICY "Public can read active partners by domain"
  ON public.partners FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Add partner_id to purchases
ALTER TABLE public.purchases ADD COLUMN partner_id uuid REFERENCES public.partners(id);
