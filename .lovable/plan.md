

## Backfill: Ativar plano CONEXÃO + 10 créditos para todos os usuários sem plano

### Diagnóstico

No painel admin aparecem usuários "Sem plano" porque suas `user_subscriptions` estão como `CANCELED` (ou inexistentes). A `UsersManagement.tsx` só considera status `ACTIVE`, `PENDING` ou `OVERDUE` — daí o "Sem plano".

### O que vou fazer (operação de dados)

**1. Identificar usuários elegíveis**
- Todos os perfis em `profiles` que **NÃO** têm role `MASTER_ADMIN` em `user_roles`.
- Que **NÃO** possuem nenhuma `user_subscriptions` com status `ACTIVE` no momento.

**2. Para cada usuário elegível**
- **Inserir** uma `user_subscriptions`:
  - `plan_id` = id do plano com `slug = 'conexao'`
  - `status` = `'ACTIVE'`
  - `payment_method` = `'FREE'`
  - `current_period_start` = `now()`
  - `current_period_end` = `now() + interval '1 month'`
- **Creditar +10** em `profiles.credit_balance` (somar, não sobrescrever — preserva créditos legados de quem já tem saldo).
- **Registrar** uma linha em `credit_transactions`:
  - `credits_used` = 10
  - `type` = `'SUBSCRIPTION_RENEWAL'`
  - `lead_id` = `NULL`

**3. Validação pós-execução**
- `SELECT count(*) FROM profiles p WHERE NOT EXISTS (SELECT 1 FROM user_subscriptions s WHERE s.user_id = p.id AND s.status = 'ACTIVE') AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.id AND r.role = 'MASTER_ADMIN')` deve retornar **0**.
- Conferir no painel admin → coluna "Plano" preenchida com "Conexão" para todos os não-admins.

### O que NÃO muda

- Admins continuam **sem** assinatura forçada (mantém comportamento atual).
- Quem já tem plano `ACTIVE` (Conexão ou pago) **não é tocado** — não duplica nem zera créditos.
- O trigger `handle_new_user` já provisiona Conexão automaticamente para novos cadastros (feito na entrega anterior), então isso é só backfill da base atual.

### Tudo via uma única operação SQL

Operação atômica que faz tudo em uma transação, segura para rodar várias vezes (idempotente — só age em quem realmente está sem plano ACTIVE).

