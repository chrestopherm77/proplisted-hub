## Módulo de Eventos

Criar um módulo de **Eventos do Mercado Imobiliário** onde apenas administradores cadastram eventos e usuários (corretores) visualizam a lista e clicam para comprar/se inscrever diretamente no site do organizador.

Por enquanto, igual aos módulos "Alugue em Parceria" e "Procuram-se Terrenos", a visualização ficará **restrita a ADM** (controlada no `AppSidebar.tsx`).

### 1. Banco de dados

Nova tabela `public.events`:
- `title` (nome do evento)
- `description` (opcional)
- `event_date` (data/hora do evento)
- `end_date` (opcional, para eventos de múltiplos dias)
- `city`, `state` (UF)
- `location_name` (local físico, opcional)
- `external_url` (link para compra/inscrição)
- `cover_image_url` (opcional)
- `is_active`
- `sort_order`
- `created_at`, `updated_at`

**RLS / GRANT:**
- `SELECT` público a `authenticated` quando `is_active = true`
- `ALL` apenas para `MASTER_ADMIN`
- Trigger de `updated_at`

### 2. Admin

- Novo item no `AdminLayout.tsx` (grupo "Conteúdo"): **"Eventos"** → `/admin/events`
- Componente `EventsManagement.tsx` (espelhado em `RentalPartnersManagement`):
  - Listagem em tabela com ordenação por data
  - Botão "Novo Evento" → modal com formulário (título, descrição, data, UF/cidade via IBGE, local, URL externa, upload de capa, ativo)
  - Ações: editar, ativar/desativar, excluir
- Registrar rota em `Admin.tsx` (seção `events`) e no `App.tsx`

### 3. Página pública (restrita)

- Rota `/eventos` → `Events.tsx`
- Filtros: **Estado**, **Cidade** (dependente, via IBGE) e **Data** (range ou a partir de)
- Cards/lista com imagem de capa, título, data formatada, cidade/UF, local e botão **"Acessar evento"** que abre `external_url` em nova aba
- Estado vazio amigável quando filtros não retornarem resultados

### 4. Sidebar

- Em `AppSidebar.tsx`, adicionar link **"Eventos"** (ícone `CalendarDays`) visível **somente quando `isAdmin === true`**, no mesmo bloco onde hoje vivem "Alugue em Parceria" e "Procuram-se Terrenos"

### 5. Storage

- Reutilizar bucket existente (ex.: `landing-pages` ou `news-images`) para a capa do evento — evita criar novo bucket. Caminho: `events/{uuid}.jpg`

### Detalhes técnicos

- Hook `useEvents.ts` para fetch + filtros (estado, cidade, data) usando supabase client
- Reuso de `useIBGELocation` para selects de UF/Cidade
- Upload de imagem com compressão (`@/lib/imageCompression`) — mesmo padrão de `RentalPartnersManagement`
- Sem alterações de pricing/créditos: módulo puramente informativo com redirect externo
