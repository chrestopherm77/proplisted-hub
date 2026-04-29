## Galeria de vídeos em Primeiros Passos

Hoje a página `/primeiros-passos` mostra **um único vídeo** vindo da tabela singleton `onboarding_video`. Vamos evoluir para uma estrutura de **playlist**: um vídeo principal grande à esquerda e uma lista de vídeos secundários à direita (com thumbnail, título e topico), onde clicar troca o vídeo principal — estilo YouTube/Vimeo Showcase.

Foco em **Vimeo** (também aceita YouTube e MP4 já existentes, sem regressão).

### Banco de dados (migração)

Nova tabela `onboarding_videos` (plural, lista) — convive com `onboarding_video` (singleton, vira o "vídeo de entrada / destaque"):

```
onboarding_videos
- id (uuid, pk)
- title (text, obrigatório) — ex: "Como comprar leads"
- topic (text, opcional) — chip/categoria curto, ex: "Leads", "Criativos"
- video_url (text, obrigatório)
- video_type (text: 'url' | 'mp4', default 'url')
- thumbnail_url (text, opcional) — preenchido automaticamente para Vimeo via API pública
- description (text, opcional)
- sort_order (int, default 0)
- is_active (bool, default true)
- created_at, updated_at, updated_by
```

RLS:
- `SELECT` para `authenticated` quando `is_active = true`
- `ALL` para `MASTER_ADMIN` (mesmo padrão de `onboarding_video`)

A tabela `onboarding_video` **continua existindo** e representa o vídeo "Boas-vindas / destaque" (carregado por padrão como vídeo principal ao abrir a página). Sem breaking changes.

### Admin — `OnboardingVideoManagement.tsx`

Reorganizar em **2 abas (shadcn `Tabs`)**:

1. **"Vídeo principal"** — UI atual intocada (singleton `onboarding_video`).
2. **"Vídeos da playlist"** — nova UI CRUD para `onboarding_videos`:
   - Lista em cards reordenáveis (drag handle simples com setas ↑/↓ atualizando `sort_order`).
   - Botão "Adicionar vídeo" abre dialog com:
     - Título (obrigatório)
     - Tópico (opcional, chip)
     - Tipo: URL (Vimeo/YouTube) ou MP4
     - URL ou upload (reutiliza bucket `onboarding-videos`)
     - Descrição (opcional)
     - Toggle ativo
   - Ao salvar URL do Vimeo, buscar thumbnail via `https://vimeo.com/api/oembed.json?url=<url>` (endpoint público, sem chave) e gravar `thumbnail_url`. Para YouTube, usar `https://img.youtube.com/vi/<id>/hqdefault.jpg`. Para MP4, deixar `thumbnail_url` null (UI usa placeholder).
   - Editar/remover por linha.

### Página pública — `src/pages/PrimeirosPassos.tsx`

Nova layout em grid `lg:grid-cols-3`:

```text
+-----------------------------+----------------+
|                             | [thumb] Tópico |
|       VÍDEO PRINCIPAL       | Título do v.1  |
|       (player grande)       +----------------+
|         16:9 player         | [thumb] Tópico |
|                             | Título do v.2  |
+-----------------------------+----------------+
| Título + descrição abaixo   | [thumb] ...    |
+-----------------------------+----------------+
```

Comportamento:
- Carrega `onboarding_video` (singleton) → vira o **vídeo selecionado por padrão**.
- Carrega `onboarding_videos` ordenado por `sort_order` → renderiza lista lateral.
- Estado local `selectedVideo`. Clicar num item da lista substitui o player principal e atualiza título/descrição abaixo.
- Cada item da lista mostra: thumbnail (16:9, `aspect-video`), badge do tópico, título em 2 linhas, ícone de play sobreposto no hover.
- Mobile (`<lg`): lista vira carrossel horizontal abaixo do player ou stack vertical scrollável (max-height ~70vh).
- Botões "Ir para Meus Leads" / "Comprar Créditos" continuam embaixo.

Player único reutilizável (componente interno `VideoPlayer`) que suporta `mp4` / `youtube` / `vimeo` (mesma lógica de `getYouTubeId` + `getVimeoId` já existente).

### Detalhes técnicos

- Vimeo embed: `https://player.vimeo.com/video/<ID>` (já implementado no `renderPlayer` atual — só extrair em componente reutilizável).
- Vimeo oEmbed (server-side desnecessário; CORS está aberto): `fetch('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(url))` retorna `thumbnail_url` em alta resolução. Chamado no admin no momento de salvar.
- Tipos do Supabase (`src/integrations/supabase/types.ts`) regeram automaticamente após a migração.
- Sem alterações em rotas, auth, navegação ou bucket de storage.

### Arquivos alterados/criados

- **Migração SQL**: criar tabela `onboarding_videos` + RLS + trigger `updated_at`.
- **`src/components/admin/OnboardingVideoManagement.tsx`**: envolver UI atual em `Tabs`, adicionar aba "Playlist" com CRUD.
- **Novo `src/components/admin/OnboardingPlaylistManager.tsx`**: lista + dialog de criar/editar + reordenação + lookup oEmbed do Vimeo.
- **`src/pages/PrimeirosPassos.tsx`**: novo layout grid com player + lista lateral; estado de seleção; carregamento das duas tabelas.
- **Novo `src/components/onboarding/VideoPlayer.tsx`** (opcional, mas limpa o código): componente reutilizável para mp4/youtube/vimeo.

### Fora de escopo

- Não mexer em autenticação, rotas, ou outras partes do admin.
- Não criar Vimeo Showcase API ou integração paga (apenas oEmbed público).
- Sem analytics de quais vídeos foram assistidos (pode ser feito depois).
