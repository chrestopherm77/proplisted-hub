

# Plano: White-Label sem alteração de pagamento

## Objetivo
Criar sistema white-label onde parceiros usam domínios próprios com branding customizado, **sem mexer no fluxo de pagamento atual**. Preços e checkout permanecem idênticos.

## O que muda
- Parceiro acessa pelo domínio dele → app detecta e aplica logo/cores dele
- Esconde elementos internos (admin, links LeadBay)
- Compras ficam registradas com `partner_id` para rastreamento futuro

## Etapas

### 1. Criar tabela `partners` no banco
Campos: `id`, `name`, `slug`, `custom_domain`, `logo_url`, `primary_color`, `secondary_color`, `is_active`, `created_at`.
RLS: admin gerencia tudo, leitura pública pelo domínio.

### 2. Adicionar `partner_id` na tabela `purchases`
Coluna nullable para rastrear origem da venda por parceiro.

### 3. Criar hook `usePartner` + `PartnerContext`
- Lê `window.location.hostname`
- Consulta tabela `partners` pelo `custom_domain`
- Disponibiliza config do parceiro em contexto React
- Se não encontrar parceiro, opera como LeadBay normal

### 4. Adaptar `Layout.tsx`
- Se há parceiro ativo: trocar logo, aplicar cores via CSS variables
- Esconder link de Admin e elementos exclusivos LeadBay
- Footer mostra nome do parceiro em vez de "LeadBay"

### 5. Adaptar `Checkout.tsx` e `create-payment`
- Passar `partner_id` no payload do checkout
- Salvar `partner_id` na purchase (sem alterar valores/split)

### 6. Aba "Parceiros" no Admin
- CRUD de parceiros (nome, domínio, logo URL, cores, ativo/inativo)
- Visualizar vendas originadas por cada parceiro

### 7. Configuração de domínio (manual)
- Adicionar domínio do parceiro no Vercel (Settings → Domains)
- Parceiro aponta CNAME para o projeto Vercel
- SSL automático pelo Vercel

## O que NÃO muda
- Preços dos leads (sem markup)
- Fluxo de pagamento Asaas (sem split)
- Autenticação (mesma base de usuários)
- Dados centralizados no banco LeadBay

## Arquivos principais afetados
- **Novo**: `src/hooks/usePartner.tsx`, `src/contexts/PartnerContext.tsx`
- **Editados**: `Layout.tsx`, `App.tsx`, `Admin.tsx`, `Checkout.tsx`, `create-payment/index.ts`
- **Migração**: nova tabela `partners` + coluna `partner_id` em `purchases`

