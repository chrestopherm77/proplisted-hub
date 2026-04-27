## O que será feito

Três melhorias na aba **Admin → Usuários**:

### 1. Excluir usuário do sistema
- Nova edge function `admin-delete-user` (valida `MASTER_ADMIN`) que remove o usuário do `auth.users` usando o service role (`auth.admin.deleteUser`).
- A exclusão remove a conta totalmente — o e-mail/telefone fica liberado e a pessoa pode se cadastrar de novo normalmente, recebendo um novo `id` e o plano Conexão grátis ativado pelo trigger `handle_new_user`.
- Limpeza prévia de dados que poderiam bloquear o re-cadastro:
  - `DELETE FROM profiles WHERE id = user_id` (libera o telefone para o trigger `check_phone_limit`).
  - Limpa registros que referenciam o `user_id` em tabelas sem cascade (purchases, credit_transactions, user_subscriptions, user_roles, lead_crm_status, creatives, properties, launches, alertas, etc.) para evitar lixo.
- Botão "Excluir" na coluna de ações da tabela com `AlertDialog` de confirmação ("Esta ação é irreversível. O usuário será removido e poderá se cadastrar novamente.").

### 2. Barra de rolagem horizontal sempre visível
- A tabela hoje usa `overflow-auto` — a scrollbar só aparece ao passar o mouse em alguns SOs.
- Trocar para um wrapper com `overflow-x-scroll` + classes utilitárias forçando `scrollbar` visível (ou estilo CSS leve em `index.css` para esse contêiner) para que a barra fique permanentemente visível na parte de baixo.

### 3. Modal de detalhes do usuário
- Clicar na linha (ou em um botão "Ver") abre um `Dialog` com **todas as informações** do perfil:
  - Dados pessoais/empresa (nome, e-mail, telefone, CPF/CNPJ, tipo, profissão, registros CRECI/CAU/CREA, RT em PJ).
  - Endereço completo.
  - Plano atual + status, créditos, código de indicação, indicado por, data de cadastro.
  - Resumo: nº de leads comprados, nº de imóveis cadastrados, último login.
- Ações disponíveis dentro do modal:
  - Ajustar créditos (reaproveita `AdjustCreditsDialog`).
  - Ativar/inativar conta.
  - Excluir usuário (com confirmação).
  - Copiar e-mail/telefone.

## Detalhes técnicos

**Arquivos novos**
- `supabase/functions/admin-delete-user/index.ts` — recebe `{ user_id }`, valida JWT + `MASTER_ADMIN`, executa cleanup + `auth.admin.deleteUser`. CORS restrito como nas outras admin functions.
- `src/components/admin/UserDetailsDialog.tsx` — modal com todas as infos + ações.

**Arquivos editados**
- `src/components/admin/UsersManagement.tsx`:
  - Nova coluna "Ações" com botões Ver / Excluir.
  - Linha clicável abre `UserDetailsDialog`.
  - Wrapper da tabela com scrollbar horizontal sempre visível.
  - Função `deleteUser` que invoca a edge function e remove o perfil do estado local.

**Cleanup SQL no edge function** (ordem segura):
```
DELETE lead_crm_status, creatives, properties, launches, lead_alerts,
       launch_alerts, property_search_alerts, property_search_offers,
       property_searches, credit_transactions, credit_purchases,
       purchases, user_subscriptions, user_roles, login_history,
       coupon_usages, voucher_redemptions, news_likes, news_comments,
       support_tickets/messages, profiles  WHERE user_id/id = ?
auth.admin.deleteUser(user_id)
```

**Re-cadastro permitido**: como removemos a linha de `profiles` (que guarda o telefone) e a conta do `auth.users`, o trigger `check_phone_limit` e a unicidade de e-mail liberam o novo registro normalmente.

Posso prosseguir com a implementação?