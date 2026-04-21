-- Reverter para modelo PRO como padrão
ALTER TABLE public.creative_styles ALTER COLUMN ai_model SET DEFAULT 'google/gemini-3-pro-image-preview';
UPDATE public.creative_styles SET ai_model = 'google/gemini-3-pro-image-preview';