

## Sistema de Assinaturas (Asaas) com 4 planos + limites por plano

### Etapa 1 — Fundação de assinaturas (esta entrega)
Criar a estrutura completa de planos, checkout, webhook e tela de planos. **A enforcement de limites por plano (bloqueios de "máx X imóveis", "máx X criativos", etc.) fica para a Etapa 2** após essa base estar funcionando.

---

### 1. Banco de dados

**Nova tabela `subscription_plans`** (gerenciada via admin, não no painel Asaas):
- `id`, `slug` (`conexao` | `essencial` | `performance` | `elite`), `name`, `price` (numeric), `monthly_credits` (int), `display_order` (int), `is_active` (bool)
- `features` (jsonb) — para os limites: `partnership_requests`, `partnership_offers`, `portal_properties`, `creatives_per_month`, `leads_included`, `hot_seat_per_month`, `training_level` (`basic` | `intermediate` | `advanced`). Valor `-1` = ilimitado, `0` = não tem.
- `feature_list` (jsonb array de strings) — bullets exibidos no card

**Nova `user_subscriptions`**:
- `id`, `user_id`, `plan_id`, `asaas_subscription_id` (text), `asaas_customer_id` (text)
- `status`: `PENDING` | `ACTIVE` | `OVERDUE` | `CANCELED` | `EXPIRED`
- `current_period_start`, `current_period_end` (timestamptz)
- `next_due_date` (date), `created_at`, `canceled_at`
- Único: um `ACTIVE` por `user_id`

**Nova `subscription_payments`** (histórico mensal):
- `id`, `subscription_id`, `user_id`, `asaas_payment_id`, `amount`, `status`, `paid_at`, `due_date`, `payment_method`, `invoice_url`

**RLS**: `subscription_plans` leitura pública/auth; `user_subscriptions` e `subscription_payments` o usuário vê o próprio, admin vê tudo.

**Seed dos 4 planos** (já com features e bullets exatos que você passou):

```text
CONEXÃO  — R$ 0,00    — 10 créditos/mês
ESSENCIAL — R$ 39,90  — 30 créditos/mês
PERFORMANCE — R$ 79,90 — 430 créditos/mês
ELITE — R$ 149,90 — 1000 créditos/mês
```

Limites já configurados em `features` conforme sua especificação (1/5/3 imóveis para Conexão, 5/10/10 para Essencial, ilimitado para Performance/Elite, criativos 1/3/15/30, leads inclusos 0/0/2/5, hot seat 0/0/2/2, treinamento basic / basic+inter / basic / basic).

---

### 2. Edge Functions

**`create-subscription`** (verify_jwt = true):
- Recebe `{ planId, paymentMethod (PIX|CREDIT_CARD), customerData }`.
- Plano `CONEXÃO` (preço 0): cria `user_subscriptions` ACTIVE direto, credita 10 créditos, sem ir ao Asaas.
- Planos pagos:
  1. Cria/busca cliente no Asaas (`POST /customers`).
  2. Chama `POST /subscriptions` com `cycle: MONTHLY`, `value`, `nextDueDate`, `externalReference: sub_<uuid>`, billing type escolhido.
  3. Salva `user_subscriptions` com status PENDING + `asaas_subscription_id`.
  4. Retorna `invoiceUrl` do primeiro `payment` (link para pagar a 1ª mensalidade).

**`cancel-subscription`** (verify_jwt = true):
- `DELETE /subscriptions/{id}` no Asaas → marca `status: CANCELED`, `canceled_at: now()`. Mantém acesso até `current_period_end`.

**Update em `asaas-webhook`** (já tem a base):
- Detectar evento de assinatura via `payload.payment.subscription` ou `externalReference: sub_*`.
- `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` em pagamento de assinatura:
  - Insere em `subscription_payments`.
  - Atualiza `user_subscriptions`: status ACTIVE, `current_period_start = now()`, `current_period_end = now() + 1 month`, `next_due_date` do Asaas.
  - **Credita `plan.monthly_credits`** em `profiles.credit_balance` (idempotente via `asaas_payment_id` único).
- `PAYMENT_OVERDUE`: status OVERDUE.
- `SUBSCRIPTION_DELETED`: status CANCELED.

Tudo idempotente checando `asaas_webhook_events.processed`.

---

### 3. Frontend

**Nova página `/planos`** (`src/pages/Planos.tsx`):
- 4 cards lado a lado (responsivo: stack em mobile, 2x2 em tablet, 4 em desktop).
- Card destaca: nome, preço/mês, créditos/mês, lista de bullets do `feature_list`, botão "Assinar" (ou "Plano Atual" / "Fazer Upgrade").
- Plano PERFORMANCE marcado como "Mais Popular" visualmente.
- Ao clicar "Assinar":
  - Conexão (free) → confirma e ativa direto.
  - Pagos → modal pedindo CPF/CNPJ + escolha PIX/Cartão → chama `create-subscription` → redireciona para `invoiceUrl` do Asaas.

**Card "Minha Assinatura" no Profile** (`src/components/profile/MySubscriptionCard.tsx`):
- Mostra plano atual, status, próxima cobrança, créditos do mês, botão "Trocar plano" (vai para `/planos`) e "Cancelar".

**Aba "Assinaturas" no Admin** (`src/components/admin/SubscriptionsManagement.tsx`):
- Lista todas as `user_subscriptions` com filtro por status, mostra MRR (soma dos planos ativos), permite ver histórico de pagamentos.

**Link no menu** para `/planos` (sidebar e mobile menu).

---

### 4. Configuração do Asaas

Esta entrega NÃO requer criar nada manualmente no painel do Asaas. Os planos vivem no nosso banco; o Asaas só recebe `POST /subscriptions` quando o usuário assina. Webhook já está configurado.

---

### Arquivos afetados/criados

**Migration**: `supabase/migrations/<ts>_subscriptions.sql` (3 tabelas + RLS + seed dos 4 planos)

**Edge Functions (novas)**:
- `supabase/functions/create-subscription/index.ts`
- `supabase/functions/cancel-subscription/index.ts`

**Edge Functions (editar)**:
- `supabase/functions/asaas-webhook/index.ts` — adicionar handler de subscription
- `supabase/config.toml` — `verify_jwt = true` para as 2 novas

**Frontend (novos)**:
- `src/pages/Planos.tsx`
- `src/components/profile/MySubscriptionCard.tsx`
- `src/components/admin/SubscriptionsManagement.tsx`
- `src/components/plans/PlanCard.tsx`
- `src/components/plans/SubscribeDialog.tsx`

**Frontend (editar)**:
- `src/App.tsx` — rota `/planos`
- `src/components/AppSidebar.tsx` + `MobileMenu.tsx` — item "Planos"
- `src/pages/Profile.tsx` — incluir `MySubscriptionCard`
- `src/pages/Admin.tsx` — nova aba "Assinaturas"

### O que NÃO entra agora (Etapa 2)

- Bloqueio efetivo de funcionalidades por plano (ex.: bloquear cadastrar 4º imóvel no plano Conexão, limitar criativos do mês, contagem de hot seats, gating de treinamentos). Essa lógica usa `features` já gravado nos planos — implemento em seguida, com toasts e CTAs de upgrade.
- Pró-rata em upgrade/downgrade no meio do mês. Por enquanto: troca de plano cancela o atual e cria novo (cobra próximo ciclo cheio).

