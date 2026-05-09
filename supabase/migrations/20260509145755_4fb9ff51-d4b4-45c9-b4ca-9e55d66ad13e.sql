
CREATE TABLE public.broker_portal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'NEW',
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  slug text,
  custom_domain text,
  template_id integer NOT NULL DEFAULT 1,
  properties_source text NOT NULL DEFAULT 'OWN',
  city text,
  state text,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.broker_portal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit portal requests"
ON public.broker_portal_requests FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(contact_name)) > 0
  AND length(trim(contact_email)) > 0
  AND length(trim(contact_phone)) > 0
);

CREATE POLICY "Admins manage portal requests"
ON public.broker_portal_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE TRIGGER trg_broker_portal_requests_updated_at
BEFORE UPDATE ON public.broker_portal_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for public uploads from the request form
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-requests', 'portal-requests', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read portal-requests"
ON storage.objects FOR SELECT
USING (bucket_id = 'portal-requests');

CREATE POLICY "Public upload portal-requests"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'portal-requests');
