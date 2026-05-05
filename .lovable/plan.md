## Painel de Afiliados (Parceiros de Indicação)

Sistema para o admin cadastrar afiliados, gerar link único de divulgação e dar a cada afiliado um painel próprio com métricas de cadastros e comissões geradas pelos planos pagos.

### Como vai funcionar (visão geral)

1. **Admin** cria um afiliado em `/admin/affiliates` (nome, email, % de comissão, status ativo).
2. Sistema gera um **código único** (ex: `joao-silva`) e o link: `https://conectaeimob.com.br/?ref=joao-silva`.
3. Quando alguém abre o link, o `ref` fica salvo (cookie/localStorage) e é gravado no perfil ao se cadastrar.
4. Quando esse usuário paga uma assinatura (qualquer ciclo: mensal, trimestral ou anual), o webhook do Asaas registra automaticamente uma **comissão** para o afiliado, com o valor (% sobre o pago) e o mês de referência.
5. O afiliado, ao logar com o email cadastrado, vê o **painel `/afiliado`** com:
   - Total de cadastros vindos do link dele
   - Quantos viraram assinantes pagos
   - Valor de comissão acumulado no mês atual e meses anteriores
   - Lista de pagamentos recentes (cliente, plano, valor, comissão, data)

Apenas usuários marcados como afiliados ativos enxergam esse painel.

### Telas

**Admin → Afiliados** (nova entrada na sidebar admin)
- Tabela: Nome, Email, Código/Link (com botão copiar), % Comissão, Cadastros, Pagantes, Comissão do mês, Status, Ações.
- Modal "Novo Afiliado": nome, email, código (auto-sugerido, editável), % comissão (default 20%), ativo.
- Detalhe do afiliado: lista todas comissões + cadastros indicados.

**Afiliado → `/afiliado`** (público após login, só libera se for afiliado ativo)
- Cards: link de divulgação (copiar), total de cadastros, assinantes ativos, comissão do mês, comissão total.
- Gráfico simples por mês.
- Tabela de comissões: cliente (parcial mascarado), plano, valor pago, % , comissão, data.

### Mudanças técnicas

**Banco (migration)**
- `affiliates` — `id, user_id (nullable, FK virtual p/ profiles), name, email unique, code unique, commission_percent (default 20), is_active, created_at`.
- `affiliate_referrals` — `id, affiliate_id, referred_user_id unique, created_at` (vínculo de quem se cadastrou pelo link).
- `affiliate_commissions` — `id, affiliate_id, referred_user_id, subscription_id, payment_id (asaas), plan_slug, gross_amount, commission_percent, commission_amount, reference_month (date), status (PENDING/PAID), created_at`.
- RLS:
  - Admin (`MASTER_ADMIN`) gerencia tudo.
  - Afiliado lê só linhas onde `affiliate_id` = seu próprio (via função `is_affiliate(auth.uid())` que cruza `affiliates.user_id = auth.uid()`).
- Função `get_affiliate_summary(p_user_id)` → totais por mês (usada no painel do afiliado).
- Trigger em `handle_new_user`: se metadata vier com `ref_code`, registra em `affiliate_referrals`.

**Captura do `?ref=`**
- Componente `AffiliateRefCapture` no `App.tsx` lê `?ref=` e salva em `localStorage.affiliate_ref`.
- `SimpleSignup.tsx` envia esse valor no `signUp` metadata como `ref_code`.
- Quando admin cria afiliado e ele se cadastra com o mesmo email, fazemos o `link` (`affiliates.user_id = profile.id`) automaticamente via trigger no insert de profiles (match por email).

**Asaas webhook (`supabase/functions/asaas-webhook/index.ts`)**
- Ao confirmar pagamento de assinatura (PAID/CONFIRMED), buscar `affiliate_referrals` do `user_id`. Se existir e o afiliado estiver ativo, inserir linha em `affiliate_commissions` com `commission_amount = valor_pago * percent / 100` e `reference_month = data truncada no mês`.
- Idempotente por `payment_id` (unique).

**Frontend**
- `src/pages/AffiliateDashboard.tsx` — painel do afiliado.
- `src/components/admin/AffiliatesManagement.tsx` — CRUD admin + detalhes.
- Adicionar rota `/afiliado` e `/admin/affiliates` no `App.tsx` e item na `ADMIN_NAV` (`AdminLayout.tsx`).
- Adicionar atalho "Painel do Afiliado" no menu do usuário (`UserAvatarMenu.tsx`) só quando o usuário for afiliado ativo (hook `useIsAffiliate`).

### Pontos a confirmar

- **% de comissão padrão**: sugiro **20%** sobre o valor pago, configurável por afiliado. OK?
- **Recorrência da comissão**: a comissão é gerada a **cada pagamento confirmado** (mensal/trimestral/anual) enquanto o cliente continuar pagando — é assim que você quer? (ou só no primeiro pagamento?)
- **Pagamento ao afiliado**: por enquanto o painel apenas **mostra** o valor a pagar (status PENDING/PAID). O repasse é manual fora do sistema, com botão "Marcar como pago" no admin. OK?
