## Nova seção Admin: "Link Público"

Criar uma nova área no painel admin onde você faz upload de vídeos e cada um gera uma página pública (link compartilhável) para qualquer pessoa assistir, sem login.

### O que será feito

**1. Tabela no banco** (`public_videos`)
Armazena os vídeos publicados com:
- `id`, `slug` (usado na URL pública, ex: `/v/meu-video`)
- `title` (título exibido na página)
- `description` (opcional)
- `video_url`, `video_type` (`mp4` ou `url` — YouTube/Vimeo)
- `is_active`, `view_count`, timestamps

RLS: SELECT público apenas dos ativos; INSERT/UPDATE/DELETE apenas para `MASTER_ADMIN` (via `has_role`).

**2. Reutilização do storage**
Usa o bucket `onboarding-videos` (já público) com prefixo `public/` para os arquivos MP4. Sem precisar criar bucket novo.

**3. Nova página admin** — `/admin/public-videos`
- Item no menu lateral, grupo "Conteúdo", ícone `Video` (entre "Primeiros Passos" e os demais).
- Lista os vídeos cadastrados em cards com: thumbnail/ícone, título, slug, status, contador de views, botão para copiar o link público, editar e excluir.
- Botão "Adicionar vídeo" abre dialog com:
  - Título (obrigatório)
  - Slug (auto-gerado a partir do título; editável; validado para `[a-z0-9-]`)
  - Descrição
  - Origem: URL (YouTube/Vimeo) **ou** Upload MP4/WebM (até 100MB)
  - Switch "Ativo"
- Botão "Copiar link" copia a URL completa (`window.location.origin + /v/<slug>`).

**4. Nova página pública** — `/v/:slug`
- Acessível sem login.
- Layout limpo: header com logo da marca, título grande, descrição, player de vídeo (16:9, ocupa quase toda a tela em mobile, centrado em desktop), `lang="pt-BR"`.
- Reutiliza o componente `VideoPlayer` existente (já trata MP4/YouTube/Vimeo).
- Incrementa `view_count` ao carregar (via RPC `increment_public_video_view`).
- Se slug não existe ou está inativo → mostra mensagem amigável "Vídeo não disponível".

### Detalhes técnicos

- **Migração SQL**: cria tabela `public_videos`, RLS, função `increment_public_video_view(p_slug text)` (SECURITY DEFINER) e índice em `slug`.
- **Rotas a adicionar em `src/App.tsx`**:
  - `/admin/public-videos` → `<Admin section="public-videos" />`
  - `/v/:slug` → `<PublicVideoPage />` (registrar **antes** do catch-all `/:customSlug`)
- **Arquivos novos**:
  - `src/components/admin/PublicVideosManagement.tsx` (lista + dialog de criação/edição + upload).
  - `src/pages/PublicVideo.tsx` (página pública).
- **Arquivos editados**:
  - `src/App.tsx` (rotas).
  - `src/pages/Admin.tsx` (registra `'public-videos': PublicVideosManagement`).
  - `src/components/admin/AdminLayout.tsx` (item de menu no grupo "Conteúdo").
  - `src/lib/reservedSlugs.ts` e o trigger `validate_landing_page_slug` (adicionar `'v'` aos reservados, para não conflitar com landing pages customizadas).

### Resultado para você

No admin, item **"Link Público"**. Cria 2 vídeos, cada um com seu título e slug, copia o link (ex: `proplisted-hub.lovable.app/v/treinamento-1`) e envia. Quem abrir vê a página com o título e o vídeo tocando direto, sem login.
