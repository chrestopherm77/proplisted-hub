-- Tabela de posts
CREATE TABLE public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active posts" ON public.news_posts
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage posts" ON public.news_posts
  FOR ALL TO public USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Tabela de curtidas
CREATE TABLE public.news_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own likes" ON public.news_likes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes" ON public.news_likes
  FOR SELECT TO authenticated USING (true);

-- Tabela de comentários
CREATE TABLE public.news_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view comments" ON public.news_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own comments" ON public.news_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage comments" ON public.news_comments
  FOR ALL TO public USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Storage bucket para imagens
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true);

CREATE POLICY "Anyone can view news images" ON storage.objects
  FOR SELECT USING (bucket_id = 'news-images');

CREATE POLICY "Admins can upload news images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'news-images' AND has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE POLICY "Admins can delete news images" ON storage.objects
  FOR DELETE USING (bucket_id = 'news-images' AND has_role(auth.uid(), 'MASTER_ADMIN'::app_role));