# Módulo "Procura-se de Terrenos"

Plataforma onde construtoras/incorporadoras divulgam terrenos de interesse para compra. Cadastro feito apenas pelo Admin. Usuários free veem tudo, mas o contato (nome, WhatsApp, e-mail) fica borrado com CTA "Assine para ver". Usuários pagos e Admin veem tudo.

## 1. Banco de dados (migração)

**Tabela `land_searches`** (um anúncio por construtora/terreno desejado)
- `company_name` — Construtora/Incorporadora/Fundo
- `contact_name`, `contact_whatsapp` (12 dígitos), `contact_email`
- `min_area_m2` (numérico)
- `notes` (observações opcionais)
- `logo_url` (opcional)
- `is_active`, `sort_order`

**Tabela `land_search_areas`** (múltiplas regiões por anúncio)
- `land_search_id` (FK)
- `state` (UF), `city`, `zone`, `neighborhood` (opcional)

**Segurança (RLS + GRANTs):**
- `land_searches`: SELECT liberado para `authenticated` (todos veem a linha), porém os campos `contact_*` são protegidos por uma **view** `land_searches_public` que omite contato para free. O frontend consulta a base apenas se o usuário tiver plano pago ou for admin; caso contrário consulta a view.
- Implementação simples: política de SELECT base = `has_role('MASTER_ADMIN')` OR `has_active_paid_plan(auth.uid())`. View pública (security_invoker) sem campos de contato, acessível a `authenticated` e `anon`.
- ALL (insert/update/delete) restrito a `MASTER_ADMIN`.
- `land_search_areas`: SELECT público (authenticated/anon); ALL restrito a admin.

**Função auxiliar** `public.has_active_paid_plan(uuid)` — security definer, retorna true se o usuário tem `user_subscriptions.status='ACTIVE'` com plano `price > 0`.

## 2. Admin — `LandSearchesManagement.tsx`

Espelha o padrão de `RentalPartnersManagement`:
- Lista em tabela com filtros (cidade, construtora, ativo).
- Formulário (Dialog) com: empresa, contato, WhatsApp (validação 12 dígitos), e-mail, área mínima, observações, upload de logo, switch ativo, ordem.
- Bloco dinâmico de "Regiões de interesse": botão **Adicionar região** → linha com UF (select IBGE) + Cidade (select IBGE dependente) + Zona (texto) + Bairro (texto opcional). N linhas por anúncio.
- Registrar no `Admin.tsx` com a chave `land-searches` e rota `/admin/land-searches` no `App.tsx`, mais item no `AppSidebar.tsx`.

## 3. Página pública — `/procura-se-terrenos`

Nova página `LandSearches.tsx` no menu principal:
- Hero curto explicando o módulo.
- Filtros: UF, Cidade, Zona, Bairro, Construtora, Área mínima.
- **Tabela** (estilo Órulo) com colunas: Construtora • Localização (UF/Cidade/Zona/Bairro — todas regiões resumidas) • Área Mín. • Contato.
- Em telas pequenas vira lista de cards.
- Coluna "Contato":
  - **Pago/Admin:** Nome + botão WhatsApp + botão E-mail.
  - **Free/Deslogado:** texto borrado (`blur-sm select-none`) + botão "Assine para ver" → `/planos`.
- Hook `useLandSearches` busca via base ou view conforme permissão; usa `useSubscriptionLimits` para detectar plano pago.

## 4. Integrações e rotas

- Adicionar rota `/procura-se-terrenos` em `App.tsx`.
- Adicionar link no menu principal (header/sidebar do app autenticado e no portal público se aplicável).
- Reservar slug `procura-se-terrenos` em `src/lib/reservedSlugs.ts`.

## 5. Arquivos a criar/modificar

**Criar:**
- `supabase/migrations/<ts>_land_searches.sql`
- `src/components/admin/LandSearchesManagement.tsx`
- `src/pages/LandSearches.tsx`
- `src/hooks/useLandSearches.ts`

**Modificar:**
- `src/App.tsx` (rotas)
- `src/pages/Admin.tsx` (seção)
- `src/components/AppSidebar.tsx` (item de menu)
- `src/lib/reservedSlugs.ts`

## Detalhes técnicos

- Storage: reaproveitar bucket existente de logos de parceiros (ou criar `land-search-logos` público se necessário).
- WhatsApp: normalização 12 dígitos conforme regra Core do projeto; link `https://wa.me/<num>`.
- UI 100% PT-BR, `translate="no"`.
- Sem alterações em outras features.
