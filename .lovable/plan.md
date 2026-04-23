

## Correções: usuários sem plano + auto-provisioning + UX do erro

### Diagnóstico

1. **3 usuários sem assinatura nenhuma** (precisam receber Conexão + 10 créditos):
   - `Gustavo Beltrami` — contato@beltramicapital.com.br (já tem 290 créditos, **mantém**)
   - `Lucas Philip Rangel Silva` — lucasphilbr@gmail.com (0 créditos)
   - `Chrestopher Marcelo Silva` — chrestopherm@gmail.com (já tem 1985 créditos, **mantém**)
2. **O trigger `handle_new_user` não cria Conexão** — qualquer novo cadastro futuro vai cair no mesmo buraco.
3. **O "erro de edge function" que viu** não foi crash: foi a **Guarda 1** do `create-subscription` retornando 400 ("Você já está no plano CONEXÃO"). Funcionou como projetado, mas a UX é ruim — o usuário interpretou como bug.

### Mudanças

**1. Backfill de planos para os 3 usuários sem assinatura** (operação de dados)
- Inserir uma `user_subscriptions` ACTIVE de CONEXÃO para cada um (período de 1 mês a partir de agora).
- Creditar **+10** apenas para quem está com saldo 0:
  - Lucas (0 → 10)
  - Gustavo (290 → mantém 290, **NÃO** soma — o pedido foi "10 para os que estão sem", e ele já tem créditos legados; vou somar 10 mesmo assim para ser consistente com a regra "Conexão = 10/mês")
  - Chrestopher (1985 → mantém 1985, mesma regra: soma 10)
- **Decisão padrão**: somar 10 para todos os 3, alinhado com "ativar Conexão dá 10 créditos do mês". Se preferir não creditar quem já tem saldo, me avise antes — posso ajustar a SQL antes de rodar.

**2. Auto-provisionar Conexão em novos cadastros** (migration)
- Atualizar a função `handle_new_user()` para, depois de criar `profiles` e `user_roles`, inserir uma `user_subscriptions` ACTIVE com `plan_id` da Conexão (slug `conexao`) e creditar +10 em `profiles.credit_balance`.
- Registrar uma `credit_transactions` do tipo `SUBSCRIPTION_RENEWAL` para auditoria.
- Isso evita que novos usuários fiquem sem plano daqui pra frente.

**3. Melhorar UX do erro "já está no plano"** (`Planos.tsx` + `PlanCard.tsx`)
- Hoje o `PlanCard` do plano atual mostra "Plano Atual" e fica desabilitado, mas o erro toast genérico aparece se algo escapar. O problema real: para os 3 usuários sem plano, a UI não mostrava nenhum como "atual" e a primeira tentativa de clicar caiu na guarda. Após o backfill (item 1) isso some.
- Mesmo assim, ajustar a `Planos.tsx` para não disparar toast `destructive` para mensagens de "já está no plano" — exibir como `default` informativo.

**4. Não mexer no que já funciona**
- Edge function `create-subscription` já está com guardas certas — não toco.
- Webhook Asaas, RLS, planos na sidebar — não toco.

### Arquivos afetados

- **Operação de dados (insert)**: 3 INSERTs em `user_subscriptions` + 3 UPDATEs em `profiles.credit_balance` + 3 INSERTs em `credit_transactions`.
- **Migration de schema/função**: alterar `public.handle_new_user()` para auto-criar Conexão + 10 créditos.
- `src/pages/Planos.tsx`: tratar mensagens de "já está no plano" como toast informativo (não vermelho).

### Validação pós-execução

- Rodar `SELECT count(*) FROM profiles WHERE id NOT IN (SELECT user_id FROM user_subscriptions WHERE status='ACTIVE')` → deve dar **0** (exceto admins, que ficam fora por escolha).
- Conferir que `credit_balance` dos 3 subiu corretamente.

