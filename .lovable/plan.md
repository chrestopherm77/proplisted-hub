# Portais de Imóveis para Corretores

Vamos criar a **estrutura base** (banco + admin + roteamento por domínio). Os 3 templates visuais serão construídos depois quando você passar as referências.

## O que será criado agora

### 1. Banco de dados — nova tabela `broker_portals`

Cada portal pertence a um corretor (user) e tem:

- `id`, `user_id` (dono/corretor)
- `slug` (acesso via `/portal/:slug` para preview/teste)
- `custom_domain` (ex: `imoveisjoao.com.br` — para apontar via DNS)
- `template_id` (1, 2 ou 3 — qual dos 3 modelos usar)
- `is_active` (boolean — **só admin** liga/desliga)
- `properties_source` (`OWN` = só imóveis dele | `CITY` = todos do portal na cidade dele)
- `city`, `state` (usado quando `properties_source = CITY`)
- `branding` (jsonb): `logo_url`, `about`, `whatsapp`, `phone`, `email`, `instagram`, `facebook`, `tiktok`, `youtube`, `linkedin`, `address`, `primary_color`
- `seo` (jsonb): `title`, `description`, `favicon_url`
- `created_at`, `updated_at`

**RLS:**
- Admin (MASTER_ADMIN): full access
- Corretor dono: SELECT do próprio portal (read-only — só admin edita/ativa)
- Público (anon): SELECT apenas se `is_active = true` (necessário para o site renderizar sem login)

### 2. Painel ADMIN — `/admin/broker-portals`

Nova seção no sidebar admin com:

- **Lista** de portais criados (busca por corretor, domínio, cidade)
- Botão **"Novo portal"** → escolhe corretor (autocomplete em `profiles`), template (1/2/3), slug, domínio
- **Editar portal**: trocar logo, sobre, redes sociais, contatos, cor primária, template, fonte dos imóveis (OWN/CITY), cidade/UF, domínio, SEO
- **Switch Ativar/Desativar** (somente admin vê e controla)
- Botão **"Abrir preview"** → abre `/portal/:slug` em nova aba
- Instruções de DNS para apontar o domínio para a Vercel/Lovable

### 3. Roteamento por domínio (estrutura)

- Nova rota `/portal/:slug` → renderiza o portal pelo slug (preview)
- **Detecção por `custom_domain`**: hook `usePartner` já detecta hostname; criar lógica análoga `useBrokerPortal` que, quando o hostname não for o principal nem um partner, busca em `broker_portals.custom_domain`. Se achar e estiver ativo, monta o portal como home daquele domínio.
- Se `is_active = false` → exibe página "Portal indisponível"

### 4. Componente `BrokerPortalRenderer` (placeholder)

- Componente que recebe `portal` + `properties` e roteia para `<Template1 />`, `<Template2 />`, `<Template3 />`
- Os 3 templates ficam como **stubs** (header com logo + lista simples de imóveis + footer com contatos) — você passa o design depois e a gente substitui sem mexer na estrutura.

### 5. Busca de imóveis do portal

Função utilitária que, dado um `portal`:
- Se `properties_source = OWN`: `SELECT * FROM properties WHERE user_id = portal.user_id AND is_active = true`
- Se `properties_source = CITY`: `SELECT * FROM properties WHERE city = portal.city AND state = portal.state AND is_active = true`

Inclui página de detalhe `/portal/:slug/imovel/:id` (e também no domínio próprio: `/imovel/:id`).

## O que NÃO entra agora (próximas etapas)

- Design real dos 3 templates (aguardando suas referências)
- Filtros avançados, mapa, formulário de contato customizado
- Captura de leads do portal direto pro CRM do corretor

## Detalhes técnicos

**Arquivos novos:**
- `supabase/migrations/<timestamp>_broker_portals.sql` — tabela + RLS + índices em `custom_domain` e `slug`
- `src/components/admin/BrokerPortalsManagement.tsx` — listagem + dialog de criar/editar
- `src/pages/BrokerPortal.tsx` — página pública do portal
- `src/components/broker-portal/BrokerPortalRenderer.tsx`
- `src/components/broker-portal/templates/Template1.tsx`, `Template2.tsx`, `Template3.tsx` (stubs)
- `src/hooks/useBrokerPortal.ts` — detecta portal por hostname/slug

**Arquivos editados:**
- `src/App.tsx` — rotas `/portal/:slug`, `/portal/:slug/imovel/:id`, integração de detecção por domínio
- `src/pages/Admin.tsx` + `src/components/admin/AdminLayout.tsx` — nova seção `broker-portals`

Aprova pra eu seguir com essa estrutura?