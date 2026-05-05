
## Objetivo

Permitir que Essencial, Performance e Elite sejam contratados em 3 ciclos: **Mensal**, **Trimestral** ou **Anual**, com cobrança única por ciclo no Asaas e crédito proporcional (ex.: Essencial Anual = 360 créditos por cobrança).

### Tabela de preços
| Plano | Mensal | Trimestral | Anual |
|---|---|---|---|
| Essencial | R$ 39,90 | R$ 105,00 | R$ 360,00 |
| Performance | R$ 79,90 | R$ 215,00 | R$ 720,00 |
| Elite | R$ 149,90 | R$ 399,00 | R$ 1.380,00 |

## 1. Banco de dados

Migration adicionando suporte a ciclo na tabela `subscription_plans` e `user_subscriptions`:

- `subscription_plans.billing_cycle text not null default 'MONTHLY'` (valores: `MONTHLY`, `QUARTERLY`, `YEARLY`)
- `subscription_plans.cycle_months int not null default 1` (1, 3, 12)
- `subscription_plans.parent_slug text` — agrupa variações (`essencial`, `performance`, `elite`)
- Slugs novos: cria 6 novos planos (3 trimestrais + 3 anuais) preservando os 3 mensais existentes:
  - `essencial-trimestral` R$105 / `essencial-anual` R$360
  - `performance-trimestral` R$215 / `performance-anual` R$720
  - `elite-trimestral` R$399 / `elite-anual` R$1380
- Cada novo plano herda `features` e `feature_list` do mensal correspondente, mas `monthly_credits` proporcional ao ciclo (Essencial trim=90, anual=360; Performance trim=1290, anual=5160; Elite trim=3000, anual=12000) — cumprindo a regra **"Crédito por cobrança"** confirmada pelo usuário.
- `user_subscriptions.billing_cycle text` (espelho do plano, para auditoria).

## 2. UI — `/planos` (src/pages/Planos.tsx + PlanCard)

Reorganizar a tela em **4 colunas**: Conexão (grátis) + Essencial + Performance + Elite, com um **toggle Mensal / Trimestral / Anual** acima do grid (ou dentro de cada card pago).

- Toggle global controla qual variação (mês/tri/ano) é exibida nos 3 cards pagos.
- Mostra preço destacado + economia ("equivale a R$ 30,00/mês — economize 25%") quando trimestral/anual.
- Clicar em "Assinar" passa o `planId` da variação selecionada.
- Mantém todas as guardas atuais (plano atual, downgrade, pendente).

## 3. Edge function `create-subscription`

- Lê `billing_cycle` e `cycle_months` do plano.
- No payload Asaas: `cycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'` (mapeado a partir de `billing_cycle`).
- `value = plan.price` (já é o valor por cobrança).
- Mantém `nextDueDate` e o agendamento para vencimento atual quando troca de plano.

## 4. Webhook `asaas-webhook`

Ao confirmar pagamento, estender o período conforme `cycle_months`:
- `current_period_end = now + cycle_months meses`.
- Creditar `plan.monthly_credits` (já calibrado por cobrança = total do ciclo).

## 5. Home pública (opcional, leve)

`home_page_content` continua mostrando os 4 planos mensais como hoje. Se quiser, mostro um aviso "Disponível também em trimestral e anual" em cada card pago — confirme se deseja, senão deixo só dentro de `/planos`.

## Detalhes técnicos

- `useSubscriptionLimits`: nada muda — continua lendo o plano ativo do usuário e usa `monthly_credits` apenas como info; limites de funcionalidades vêm de `features` (idênticas entre variações do mesmo plano).
- `cancel-subscription`: nenhum ajuste necessário (só usa `asaas_subscription_id`).
- Slugs `conexao`, `essencial`, `performance`, `elite` ficam intactos para não quebrar referências (LP, `home_page_content`).
- Defensivo: o seletor `useSubscriptionLimits` já considera o plano ativo qualquer que seja a variação.
