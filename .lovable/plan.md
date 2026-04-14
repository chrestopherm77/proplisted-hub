

# Plano: Página "Giro do Mercado" - Feed de Notícias

## Resumo

Criar uma nova página com feed estilo Instagram onde admins publicam notícias (imagem + texto). Usuários autenticados podem curtir, comentar e compartilhar via WhatsApp. Estrutura preparada para futura integração via API.

---

## 1. Migração: Tabelas do Feed

```sql
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

-- Todos autenticados podem ver posts ativos
CREATE POLICY "Authenticated can view active posts" ON public.news_posts
  FOR SELECT TO authenticated USING (is_active = true);

-- Admins gerenciam tudo
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
```

## 2. Storage Bucket

Criar bucket `news-images` (público) para as imagens dos posts.

## 3. Nova Página: `src/pages/MarketNews.tsx`

- Feed vertical com scroll infinito (ou paginação)
- Cada card: imagem, texto com "ver mais" (truncado em ~3 linhas), data, autor
- Botões: Curtir (Heart com contagem), Comentar (abre seção), Compartilhar (WhatsApp)
- Admins veem botão "Nova Publicação" no topo com modal para upload de imagem + texto
- Compartilhar via WhatsApp: `https://wa.me/?text=...` com link e texto do post

## 4. Navegação

- Adicionar link "Giro do Mercado" no `Layout.tsx` (nav desktop) e `MobileMenu.tsx`
- Visível para todos os usuários autenticados (não restrito a admin)
- Rota `/giro-do-mercado` no `App.tsx`

## 5. Preparação para API

- Os posts são inseridos via tabela `news_posts`, então uma futura edge function ou API externa pode inserir diretamente nessa tabela
- Campo `user_id` pode ser o ID de um "bot user" quando vindo de API

---

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | 3 tabelas + bucket |
| `src/pages/MarketNews.tsx` | Nova página (feed + criar post) |
| `src/App.tsx` | Rota `/giro-do-mercado` |
| `src/components/Layout.tsx` | Link na nav desktop |
| `src/components/MobileMenu.tsx` | Link no menu mobile |

