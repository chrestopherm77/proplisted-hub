GRANT SELECT ON public.news_posts TO anon;

CREATE POLICY "Public can view active posts"
ON public.news_posts
FOR SELECT
TO anon
USING (is_active = true);