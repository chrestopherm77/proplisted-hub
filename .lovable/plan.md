

## Correções: contagem de uso histórica + bloqueio anti-fraude de plano

Encontrei dois bugs reais. O usuário `chresautomacao@gmail.com` ativou o plano grátis **3 vezes seguidas** ganhando créditos a cada clique (saldo atual 20 = 2x10), e a contagem de uso reseta quando o usuário desativa um imóvel ou parceria.

### Problema 1 — Limites resetam ao excluir/desativar

Hoje em `useSubscriptionLimits.ts`:
- `portal_properties` conta `properties WHERE is_active = true`
- `partnership_requests` conta `property_searches WHERE is_active = true`

Ao excluir/desativar, o slot volta. Você quer: **uma vez publicado, conta para sempre** (até a renovação mensal, no caso dos recursos mensais).

#### Solução

Separar a regra por tipo de recurso:

| Recurso | Janela de contagem |
|---|---|
| `portal_properties` | **Ciclo do plano** — conta tudo que foi criado dentro do período corrente da assinatura, ativo OU não. Sem assinatura paga ativa, conta a partir do início do mês corrente. |
| `partnership_requests` | **Ciclo do plano** — mesma regra. |
| `partnership_offers` | Já é mensal pelo `created_at`, mantém. |
| `creatives_per_month` | Já é mensal pelo `created_at`, mantém. |

**Implementação no `useSubscriptionLimits.ts`**:
- Buscar a assinatura ativa (já buscamos), pegar `current_period_start`. Se não existir (fallback Conexão), usar `date_trunc('month', now())`.
- Trocar as queries de `properties` e `property_searches` para `gte('created_at', cycleStart)` e remover o filtro `is_active`.
- Não toca em quem já criou no passado: o ciclo começa do `current_period_start`. Isso significa que ao **renovar/upgrade**, a contagem zera naturalmente.

Botões de "Excluir/Desativar" continuam funcionando — mas o slot consumido segue contado até o próximo ciclo.

### Problema 2 — Plano grátis pode ser reativado infinitas vezes (gera créditos infinitos)

E o problema relacionado: se o usuário tem PENDING de um pago, o card de Conexão fica clicável e ele recebe 10 créditos por clique. Bug crítico.

#### Solução em `create-subscription` (edge function)

Adicionar 3 guardas no início, **antes** de qualquer crédito ser dado:

1. **Bloquear reativação do mesmo plano grátis dentro do ciclo**:  
   Se já existe uma `user_subscriptions` (mesmo `CANCELED`) do mesmo `plan_id` grátis criada nos últimos 30 dias OU cujo `current_period_end > now()`, retornar erro: *"Você já está no plano Conexão. Aguarde o término do ciclo para reativar."*

2. **Bloquear ativação de grátis quando há PENDING pago**:  
   Se existe `user_subscriptions` com status `PENDING` e `plan.price > 0`, recusar ativação de plano grátis. O usuário deve **concluir** ou **cancelar** o pendente primeiro. Mensagem: *"Você tem uma assinatura aguardando pagamento. Conclua ou cancele para trocar de plano."*

3. **Bloquear troca quando há ACTIVE recente sem cobrança nova devida**:  
   Para evitar "sobe e desce de plano" — se já existe uma `ACTIVE` (paga) e o usuário pede outra, regra abaixo (downgrade vs upgrade).

#### Regras de troca de plano (downgrade / upgrade)

| Cenário | Comportamento |
|---|---|
| Tem ACTIVE pago e pede **outro pago** (qualquer direção) e ainda não venceu o ciclo | Cria nova subscription **PENDING** mas NÃO desativa a atual. A atual continua valendo (créditos do plano antigo permanecem) até `current_period_end`. No vencimento, o webhook do Asaas: cancela a antiga, cobra a nova, credita os créditos da nova. |
| Tem ACTIVE pago e pede **plano grátis** | Trata como downgrade pendente: cancela no Asaas (sem cobrar próxima), mantém ACTIVE atual até `current_period_end`. Quando vencer, cron/webhook converte para Conexão. |
| Tem PENDING (nunca pagou) e pede outro plano | Cancela o PENDING (incluindo no Asaas) e cria o novo. |
| Tem ACTIVE grátis (Conexão) e pede pago | Cria subscription paga PENDING. Conexão continua até pagamento confirmar. Webhook cancela Conexão e ativa nova ao confirmar pagamento. |
| Tem ACTIVE grátis e pede grátis novamente | **Bloqueado** (regra 1 acima). |

Isso resolve o "fica subindo e descendo": para planos pagos, **só uma cobrança por ciclo**. A troca é agendada para o próximo vencimento.

#### Mudanças no banco (migration)

Adicionar à `user_subscriptions`:
- `pending_downgrade_to_plan_id uuid` — guarda plano destino quando há downgrade agendado
- `scheduled_change_at timestamptz` — quando a troca acontece

#### Mudanças no `asaas-webhook`

No evento `PAYMENT_RECEIVED` de assinatura: antes de creditar, se existe outra `ACTIVE` do mesmo user com `plan_id` diferente, marcar a antiga como `EXPIRED`. Isso fecha o ciclo de troca de planos pagos.

#### Cron diário (nova edge function `process-scheduled-plan-changes`)

Roda 1x/dia. Para cada `user_subscriptions` ACTIVE grátis com `pending_downgrade_to_plan_id` setado e `scheduled_change_at <= now()` → executa downgrade efetivo. Cobertura para o caso "ACTIVE pago → grátis" sem pagar mais.

Para essa entrega, o cron pode ser simples: se `current_period_end < now()` para qualquer ACTIVE pago sem renovação confirmada → marca EXPIRED e cria Conexão automaticamente.

### Problema 3 — UI permite clicar em "Ativar Grátis" enquanto há PENDING

Em `Planos.tsx` + `PlanCard.tsx`:
- Quando existe `pendingPlanId`, **desabilitar o botão "Ativar Plano Grátis"** dos outros planos grátis com tooltip: *"Conclua ou cancele a assinatura pendente primeiro."*
- Quando existe `activePlanId` pago, mostrar nos planos de menor valor o texto **"Fazer downgrade"** (e explicar que a troca acontece no próximo ciclo).
- Quando existe `activePlanId` grátis e o usuário clica em outro grátis → desabilitar.

### Resumo do que muda

**Backend (edge functions)**
- `supabase/functions/create-subscription/index.ts`:
  - Guarda 1: bloquear reativação do mesmo plano grátis dentro do ciclo.
  - Guarda 2: bloquear ativação de grátis se há PENDING pago.
  - Guarda 3: tratar upgrade/downgrade entre pagos como agendado (não cancelar atual nem creditar dobrado).
  - Para grátis ativo já existente do mesmo plano: idempotente (não credita de novo).
- `supabase/functions/asaas-webhook/index.ts`:
  - Ao confirmar pagamento de uma nova assinatura, expirar a anterior do mesmo user.
- Nova `supabase/functions/expire-plans-cron/index.ts` (chamada por cron) — converte assinaturas vencidas sem renovação para Conexão.

**Migration**
- `ALTER TABLE user_subscriptions ADD COLUMN pending_downgrade_to_plan_id uuid, ADD COLUMN scheduled_change_at timestamptz`.

**Frontend**
- `src/hooks/useSubscriptionLimits.ts`: contagem de `portal_properties` e `partnership_requests` por ciclo (todos criados desde `current_period_start`), sem filtro `is_active`.
- `src/pages/Planos.tsx`: passar `pendingPlanId`, `activePlanId` e `activePlanIsPaid` para o `PlanCard`.
- `src/components/plans/PlanCard.tsx`: novo prop `disabledReason` para desabilitar com tooltip explicativo (grátis bloqueado por PENDING; mesmo grátis bloqueado por ciclo; downgrade agendado etc.).
- `src/components/profile/MySubscriptionCard.tsx`: mensagem clara quando há downgrade agendado ("Você tem um downgrade para X agendado para DD/MM").

**Operação de dados (correção do estado atual do usuário)**
- Marcar a Conexão duplicada `4d8620aa-...` como CANCELED (mantém a `d51b9ca8-...` mais antiga já marcada CANCELED — recriar a primeira ativa correta).
- Reverter os 20 créditos extras: `credit_balance = 0` para `82390105-3c7a-4b7b-b52a-bb0395ba4224`.

### O que NÃO muda

- Lógica de débito de créditos para criativos.
- RLS, fallback Conexão como plano padrão.
- Webhook idempotência para pagamentos individuais.

