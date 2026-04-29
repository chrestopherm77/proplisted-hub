CREATE TABLE public.onboarding_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  topic text,
  video_url text NOT NULL,
  video_type text NOT NULL DEFAULT 'url',
  thumbnail_url text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.onboarding_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active playlist videos"
  ON public.onboarding_videos FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins can manage playlist videos"
  ON public.onboarding_videos FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE TRIGGER update_onboarding_videos_updated_at
  BEFORE UPDATE ON public.onboarding_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_onboarding_videos_sort ON public.onboarding_videos(sort_order, created_at);