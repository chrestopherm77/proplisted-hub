
CREATE TABLE public.alert_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  message TEXT NOT NULL,
  link_url TEXT,
  link_label TEXT,
  bg_color TEXT NOT NULL DEFAULT '#1e40af',
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  dismissible BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active banners"
ON public.alert_banners FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);

CREATE POLICY "Admins can view all banners"
ON public.alert_banners FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins can insert banners"
ON public.alert_banners FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins can update banners"
ON public.alert_banners FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins can delete banners"
ON public.alert_banners FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE TRIGGER update_alert_banners_updated_at
BEFORE UPDATE ON public.alert_banners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
