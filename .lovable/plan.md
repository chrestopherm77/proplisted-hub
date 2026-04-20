

## Aba "Criativos" — Geração de criativos imobiliários com IA

Nova área no sistema com 3 sub-abas: **Meus Criativos**, **Minha Marca**, **Gerar Criativo**. Toda a base será criada agora; a chamada real à API (Nano Banana / Gemini) fica para a próxima fase.

### Estrutura de navegação

- Item novo no `AppSidebar`: **"Criativos"** (ícone `Sparkles`), apontando para `/criativos`.
- A rota `/criativos` carrega uma página com `Tabs` shadcn:
  - `Meus Criativos`
  - `Minha Marca`
  - `Gerar Criativo`

### Aba 1 — Meus Criativos
Galeria em grid dos criativos já gerados pelo usuário (filtrados por `user_id`).
- Cada card mostra: thumbnail, formato (Post/Stories/Tráfego), estilo, data.
- Ações: visualizar em modal, baixar imagem, excluir.
- Estado vazio amigável com CTA "Gerar primeiro criativo".

### Aba 2 — Minha Marca
Formulário simples com:
- Upload da **logo** (preview redondo + botão trocar/remover).
- Cor primária da marca (color picker — opcional, já preparando para a fase de mockup).
- Salvar.
A logo é guardada no Storage e o registro fica na tabela `user_brands`.

### Aba 3 — Gerar Criativo (wizard de 3 passos)

**Passo 1 — Imagens (1 principal + 7 secundárias)**
- Grade com 8 slots de upload.
- Slot 1 marcado como **"Principal"** (a única que iria para a API quando ela for plugada).
- Slots 2–8 são **mockups**: para cada uma, o usuário escolhe a posição da logo (4 opções: superior-esq, superior-dir, inferior-esq, inferior-dir) via overlay clicável na própria imagem.
- Preview em tempo real do mockup com a logo do usuário sobreposta (canvas) — sem chamada externa.

**Passo 2 — Estilo e Formato**
- **Estilo** (cards selecionáveis): Praia, Campo / Chácara, Comercial, Centro / Urbano, Imóvel de Luxo, Lançamento, Vendas de lotes.
- **Formato** (cards selecionáveis):
  - Post — 1080×1080
  - Stories — 1080×1920
  - Tráfego — 1200×628

**Passo 3 — Informações do imóvel**
- Textarea livre (nome, local, características, preço, etc.).
- Botão **"Gerar"**.

**Resultado**
- Tela com os 8 criativos: o "Principal" aparece como placeholder ("Será gerado pela IA — em breve") e os 7 mockups aparecem renderizados localmente com a logo nas posições escolhidas.
- Cada criativo é salvo em `creatives` para listar em "Meus Criativos".

### Painel ADMIN — gerenciar prompts dos estilos

Nova aba no `Admin.tsx`: **"Criativos"** (`CreativeStylesManagement`).
- Lista os 7 estilos pré-cadastrados.
- Para cada estilo, o admin edita:
  - Nome (display)
  - Slug interno
  - **Prompt** (textarea longa) — é o texto que será usado quando a integração com a API for ligada.
  - Ativo/inativo.
- Os prompts ficam em `creative_styles` (tabela nova) e são apenas armazenados — **nenhuma chamada à API ainda**.

### Banco de dados (novas tabelas)

**`creative_styles`** (gerenciada pelo admin)
- `id`, `slug` (unique: `praia`, `campo`, `comercial`, `centro`, `luxo`, `lancamento`, `lotes`), `name`, `description`, `prompt` (text), `is_active`, `created_at`, `updated_at`.
- RLS: SELECT para todos autenticados (ler nome/descrição); ALL apenas para `MASTER_ADMIN`.
- Seed inicial com os 7 estilos e prompts vazios (admin preenche depois).

**`user_brands`**
- `id`, `user_id` (unique), `logo_url`, `primary_color`, `created_at`, `updated_at`.
- RLS: usuário gerencia o próprio (`auth.uid() = user_id`); admins veem todos.

**`creatives`**
- `id`, `user_id`, `style_slug`, `format` (`POST` | `STORIES` | `TRAFEGO`), `info_text`, `main_image_url` (nullable — será preenchido quando a API rodar), `mockup_images` (jsonb: array com `{image_url, logo_position}`), `status` (`PENDING` | `READY` | `FAILED`), `created_at`.
- RLS: usuário gerencia os próprios; admins veem todos.

### Storage

Dois buckets públicos novos:
- `brand-logos` — logos dos usuários.
- `creatives` — imagens enviadas pelo usuário e mockups gerados.

RLS de Storage: usuário só pode inserir/atualizar/deletar dentro de pastas com seu próprio `user_id`.

### Arquivos novos / alterados

**Novos**
- `src/pages/Criativos.tsx` — página com as 3 tabs.
- `src/components/criativos/MyCreatives.tsx`
- `src/components/criativos/MyBrand.tsx`
- `src/components/criativos/GenerateCreative.tsx` — orquestra o wizard.
- `src/components/criativos/wizard/StepImages.tsx`
- `src/components/criativos/wizard/StepStyleFormat.tsx`
- `src/components/criativos/wizard/StepInfo.tsx`
- `src/components/criativos/wizard/StepResult.tsx`
- `src/components/criativos/LogoPositionPicker.tsx` — overlay com 4 posições.
- `src/components/criativos/MockupPreview.tsx` — render canvas da imagem + logo sobreposta.
- `src/components/admin/CreativeStylesManagement.tsx` — CRUD de prompts.
- Migration: cria as 3 tabelas, RLS, seed dos 7 estilos, e os 2 buckets.

**Alterados**
- `src/components/AppSidebar.tsx` — item "Criativos".
- `src/App.tsx` — rota `/criativos`.
- `src/pages/Admin.tsx` — nova aba "Criativos" (passa de 8 para 9 colunas no `TabsList`).

### Observações
- Tudo em português (`pt-BR`), seguindo o padrão do app.
- Sem chamada à API do Gemini/Nano Banana neste passo — o "Principal" fica como placeholder até plugarmos. Toda a base (estilos, prompts no admin, formatos, fluxo, persistência) já estará pronta.
- Mockups dos 7 secundários são 100% client-side (canvas), portanto funcionam de imediato.

