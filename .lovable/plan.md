

# Plano: Edge Function para receber notícias via API (n8n)

## Resumo

Criar edge function `create-news-post` + adicionar coluna `title` na tabela `news_posts`. O n8n envia título, imagem e conteúdo via HTTP POST.

## 1. Migração: adicionar coluna `title`

```sql
ALTER TABLE public.news_posts ADD COLUMN title text;
```

## 2. Edge Function: `supabase/functions/create-news-post/index.ts`

**Payload esperado do n8n:**
```json
{
  "titulo": "Título da notícia",
  "imagem": "https://link-da-imagem.com/foto.jpg",
  "noticia": "Texto completo da notícia..."
}
```

- `titulo` (obrigatório) - título da notícia
- `noticia` (obrigatório) - corpo da notícia
- `imagem` (opcional) - URL da imagem

**Header obrigatório:**
```
x-api-secret: <valor do CRON_SECRET>
```

**Resposta:**
```json
{ "success": true, "post_id": "uuid" }
```

**Detalhes:**
- Validação via `x-api-secret` usando `CRON_SECRET` (já existente)
- Inserção com `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS)
- `user_id` fixo do admin: `81437001-3b5a-4c32-8396-52f63a9f983a`
- CORS restrito aos domínios do projeto
- `verify_jwt = false` no config.toml

## 3. Atualizar frontend

Exibir o título (`title`) nos cards do feed, acima do conteúdo.

## URL para configurar no n8n

```
https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/create-news-post
```

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | `ALTER TABLE` + coluna `title` |
| `supabase/functions/create-news-post/index.ts` | Nova edge function |
| `supabase/config.toml` | Config da function |
| `src/pages/MarketNews.tsx` | Exibir título nos posts |

