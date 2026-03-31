

# Plano: Correção de Vulnerabilidades de Segurança

Relatório recebido e analisado. Vou priorizar por severidade.

---

## FASE 1 — Vulnerabilidades Críticas

### 1. `.env` no repositório público
- **Ação**: O `.env` já está no `.gitignore` e é auto-gerado pelo Lovable, então não há como removê-lo do projeto. O que você precisa fazer:
  - Tornar o repositório **privado** no GitHub o mais rápido possível
  - A anon key do Supabase é semi-pública por design (RLS protege os dados), mas mesmo assim é melhor não expô-la
  - **Não é necessária mudança de código aqui** — apenas privatizar o repo

### 2. `merge-or-create-lead` — Adicionar autenticação via shared secret
- Essa function é chamada pelo formulário público (visitantes anônimos), então não pode exigir JWT de usuário
- **Solução**: Criar um secret compartilhado (`LP_FORM_SECRET`) e validá-lo no header da requisição. O frontend envia esse secret (já que é chamada interna do sistema)
- Adicionar validação de input com limites de tamanho (nome max 200 chars, phone max 20 chars, etc.)

### 3. `notify-new-lead` — Adicionar autenticação de admin
- Essa function deveria ser chamada apenas por admins ou pelo próprio sistema
- **Solução**: Exigir JWT e verificar role `MASTER_ADMIN` via `getClaims()`, ou usar shared secret para chamadas internas

### 4. `recovery-abandoned-lead` — Adicionar autenticação
- Chamada via pg_cron (interna), mas exposta publicamente
- **Solução**: Validar um `CRON_SECRET` no header para garantir que só o cron trigger legítimo pode chamar

### 5. `get-partial-lead` — Adicionar rate limit e ofuscar dados
- O session_id é o único "segredo" que protege os dados
- **Solução**: Não retornar `phone` completo (ofuscar: `(11) 9****-1234`), e adicionar rate limiting básico

---

## FASE 2 — Vulnerabilidades Altas

### 6. `send-whatsapp-code` e `send-email-code` — Reforçar rate limit
- O rate limit atual (3/min por identificador) já existe mas é insuficiente contra ataques distribuídos
- **Solução**: Adicionar rate limit global (ex: 30 requisições/min total) além do per-identifier

### 7. `reset-password` — Remover `listUsers()`
- Atualmente lista TODOS os usuários para encontrar um email — muito perigoso
- **Solução**: Substituir `auth.admin.listUsers()` por query direta na tabela `profiles` para encontrar o user_id por email, ou usar `auth.admin.getUserByEmail()`

### 8. CORS — Restringir origens
- **Solução**: Substituir `'*'` por uma lista de origens permitidas em TODAS as edge functions:
  ```
  const allowedOrigins = ['https://leadbay.com.br', 'https://www.leadbay.com.br', 'https://proplisted-hub.lovable.app'];
  ```
  - Manter `'*'` apenas no `asaas-webhook` (webhook externo)

### 9. Race condition em vouchers/cupons
- **Solução**: Criar uma database function `redeem_voucher_atomic(p_voucher_id, p_user_id, p_lead_id)` que faz SELECT + INSERT numa transação, usando `SELECT ... FOR UPDATE` no voucher

### 10. Race condition no `purchase_count`
- No `asaas-webhook` (linha 336): `newCount = (lead.purchase_count || 0) + 1` — read-then-write
- No `redeem-voucher` (linha 181): mesmo padrão
- **Solução**: Criar database function `increment_purchase_count(p_lead_id)` que faz `UPDATE leads SET purchase_count = purchase_count + 1 ... RETURNING purchase_count, max_purchases` atomicamente

---

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/merge-or-create-lead/index.ts` | Shared secret + input validation |
| `supabase/functions/notify-new-lead/index.ts` | JWT auth + admin check |
| `supabase/functions/recovery-abandoned-lead/index.ts` | Cron secret validation |
| `supabase/functions/get-partial-lead/index.ts` | Ofuscar phone |
| `supabase/functions/reset-password/index.ts` | Remover listUsers, usar getUserByEmail |
| `supabase/functions/redeem-voucher/index.ts` | Usar RPC atômico |
| `supabase/functions/asaas-webhook/index.ts` | Usar RPC increment_purchase_count |
| Todas as edge functions (exceto asaas-webhook) | CORS restrito |
| **Migration SQL** | Criar functions `increment_purchase_count` e `redeem_voucher_atomic` |
| **Secrets** | Adicionar `LP_FORM_SECRET` e `CRON_SECRET` |
| Frontend (chamadas a merge-or-create-lead) | Enviar LP_FORM_SECRET no header |

---

## Nota sobre .env
O `.env` é gerenciado automaticamente pelo Lovable Cloud — não é possível removê-lo do projeto. A prioridade é **privatizar o repositório GitHub** para evitar exposição.

