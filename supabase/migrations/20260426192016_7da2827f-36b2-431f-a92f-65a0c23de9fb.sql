
-- Tabela de configuração do vídeo de Primeiros Passos
CREATE TABLE public.onboarding_video (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text,
  video_type text NOT NULL DEFAULT 'url' CHECK (video_type IN ('url','mp4')),
  title text DEFAULT 'Bem-vindo ao Conecta&Imob!',
  description text DEFAULT 'Assista ao vídeo abaixo e descubra como aproveitar ao máximo a plataforma.',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.onboarding_video ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read onboarding video"
ON public.onboarding_video FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage onboarding video"
ON public.onboarding_video FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- Seed: cria a row única
INSERT INTO public.onboarding_video (video_type, video_url) VALUES ('url', NULL);

-- Bucket público para uploads de MP4 (limite 100MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('onboarding-videos', 'onboarding-videos', true, 104857600,
        ARRAY['video/mp4','video/webm']);

CREATE POLICY "Public read onboarding videos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'onboarding-videos');

CREATE POLICY "Admin upload onboarding videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'onboarding-videos' AND public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admin update onboarding videos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'onboarding-videos' AND public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admin delete onboarding videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'onboarding-videos' AND public.has_role(auth.uid(), 'MASTER_ADMIN'));
