ALTER TABLE public.creative_styles ALTER COLUMN ai_model SET DEFAULT 'google/gemini-2.5-flash-image';

UPDATE public.creative_styles
SET ai_model = 'google/gemini-2.5-flash-image'
WHERE ai_model = 'google/gemini-3-flash-image-preview';