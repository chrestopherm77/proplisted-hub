

## Adicionar gestão manual de créditos no Admin → Usuários

Adicionar coluna "Créditos" na tabela de usuários do admin com o saldo atual e botão para ajustar manualmente (adicionar/remover créditos).

### O que será feito

**1. Coluna "Créditos" na tabela (`UsersManagement.tsx`)**

- Incluir `credit_balance` no `select` do `profiles`.
- Adicionar nova coluna na tabela exibindo o saldo atual em amarelo (consistente com o ícone de créditos do app).
- Adicionar botão "Ajustar" ao lado do saldo, abrindo um modal.

**2. Modal "Ajustar Créditos"**

- Mostra: nome do usuário + saldo atual.
- Campos:
  - Tipo de operação: **Adicionar** ou **Remover** (toggle/radio).
  - Quantidade (input numérico, mínimo 1).
  - Motivo/observação (textarea opcional).
- Botão "Confirmar" e "Cancelar".
- Mostra prévia do novo saldo antes de confirmar.
- Bloqueia remoção se for deixar saldo negativo.

**3. Edge function nova: `admin-adjust-credits`**

Necessária porque a tabela `profiles` só permite `UPDATE` pelo próprio dono (RLS). Admin precisa de service role.

- Valida JWT + checa `MASTER_ADMIN` via `user_roles` (mesmo padrão do `list-users`).
- Recebe: `user_id`, `amount` (int positivo), `operation` ('ADD' | 'REMOVE'), `reason` (opcional).
- Valida com Zod.
- Usa service role para:
  - Ler `credit_balance` atual.
  - Calcular novo saldo (bloqueia se ficar < 0).
  - Atualizar `profiles.credit_balance`.
  - Inserir registro em `credit_transactions` com:
    - `type`: `'ADMIN_ADD'` ou `'ADMIN_REMOVE'`.
    - `credits_used`: o `amount` (positivo nos dois casos; o tipo identifica direção).
    - `lead_id`: null.
- Retorna novo saldo.
- CORS restrito (mesma lista de origens do `list-users`).

**4. Atualização da UI após ajuste**

- Ao confirmar, atualiza o `profiles` localmente com o novo saldo (sem refetch completo).
- Toast de sucesso: "Saldo atualizado: X créditos".

### Detalhes técnicos

- `credit_transactions.type` hoje aceita texto livre (default `'LEAD_PURCHASE'`); novos tipos `'ADMIN_ADD'` / `'ADMIN_REMOVE'` não exigem migration.
- Sem alteração de schema — apenas nova edge function + UI.
- `supabase/config.toml` não precisa entrada nova (verify_jwt fica false por padrão; validação acontece no código).
- Histórico fica rastreável em `credit_transactions` (admin pode auditar depois quem ganhou/perdeu créditos).

### Resultado

- Admin abre **Painel → Usuários**, vê o saldo de créditos de cada corretor.
- Clica em "Ajustar", escolhe adicionar ou remover X créditos com motivo, confirma.
- Saldo é atualizado em tempo real e o usuário vê na sidebar dele (já há realtime no `AppSidebar`).

