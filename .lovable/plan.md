## Objetivo

Substituir o sistema atual de **código de indicação** (popup que aparece em todo login) por um sistema de **link de indicação único**, em que o crédito de 280 só é concedido quando o indicado tiver uma **assinatura paga ativa** (qualquer plano diferente do CONEXÃO/Free).

---

## 1. Substituir o popup de "Indicar" pela tela de Link de Indicação

**Arquivo**: `src/components/referral/ReferralPopup.tsx` → renomear para `ReferralCard.tsx` (ou manter o popup mas mudar o conteúdo).

- **Remover** o popup recorrente que aparece toda vez que a pessoa entra no sistema (hoje usa `sessionStorage` mas ainda aparece em toda nova sessão).
- O conteúdo de indicação passa a viver em **uma página dedicada** ou seção do **Profile** ("Meu link de indicação"), mais um item no menu do avatar (`UserAvatarMenu.tsx`) chamado **"Indicar e ganhar"**.
- Layout da nova tela:
  - Cartão com o **link único**: `https://leadbay.com.br/auth?ref=ABC12345` (usando o `referral_code` existente do perfil — não precisa mudar a coluna).
  - Botões "Copiar link", "Compartilhar no WhatsApp" (mensagem pronta).
  - Texto explicativo: *"Você ganha 280 créditos quando seu indicado se cadastrar **e ativar uma assinatura paga** (Essencial, Performance ou Elite)."*
  - Estatísticas simples: "X pessoas se cadastraram pelo seu link · Y assinaturas confirmadas · Z créditos recebidos".

**Nota**: o popup automático será **removido** completamente. A pessoa só vê quando clica no menu.

---

## 2. Captura do link `?ref=CODIGO` no cadastro

**Arquivo**: `src/pages/Auth.tsx` e `src/components/auth/MultiStepSignup.tsx`.

- Ler `?ref=` da URL na chegada da página `/auth`.
- Pré-preencher `formData.referralCode` automaticamente.
- Ocultar (ou deixar somente leitura) o campo de código manual em `CredentialsStep.tsx` quando vier do link — o usuário só vê uma mensagem: *"Você foi indicado por um corretor. Bônus aplicado após sua assinatura."*
- Manter o campo manual visível só quando **não** vier `?ref=` na URL (compatibilidade).

---

## 3. Mudar a regra de concessão dos 280 créditos (a parte crítica)

Hoje a função `redeem_referral` credita os 280 imediatamente no signup. Vamos mudar para **registrar a indicação agora** e **só creditar depois que a assinatura paga for confirmada**.

### 3.1. Nova migração SQL

- **Alterar `redeem_referral`** para apenas marcar `referred_by` no perfil do indicado e **NÃO** creditar mais nada nem marcar `referral_credits_granted = true`. (A coluna `referral_credits_granted` passa a significar "bônus já pago ao indicador", não "indicação registrada".)
- **Nova função `grant_referral_bonus_if_eligible(p_user_id uuid)`** (SECURITY DEFINER):
  1. Busca o perfil do indicado.
  2. Se `referred_by IS NULL` ou `referral_credits_granted = true` → sai.
  3. Verifica se o indicado tem `user_subscriptions` com `status = 'ACTIVE'` cujo `plan.slug != 'conexao'` (ou seja, plano pago).
  4. Se sim → credita 280 no `referred_by` via `add_credits_atomic` com tipo `REFERRAL_BONUS`, e marca `referral_credits_granted = true` no perfil do indicado.

### 3.2. Hook no webhook do Asaas

**Arquivo**: `supabase/functions/asaas-webhook/index.ts` (perto da linha 705, depois de creditar a renovação mensal).

- Após uma assinatura paga ser ativada com sucesso (status `ACTIVE` + plano com `price > 0`), chamar `supabase.rpc('grant_referral_bonus_if_eligible', { p_user_id: sub.user_id })`.
- Se o usuário não tiver indicador, a função simplesmente não faz nada.

### 3.3. Backfill (opcional)

A migração também pode rodar uma única vez para indicações **antigas** que ainda não têm crédito: para todo usuário com `referred_by IS NOT NULL AND referral_credits_granted = false` que já tem assinatura paga ativa, conceder os 280 ao indicador.

---

## 4. Mensagem de WhatsApp do link

Atualizar a mensagem existente em `ReferralPopup.tsx` para usar o **link** em vez do código:

```
Conheça a LeadBay: hub completo para corretor de imóveis.
Cadastre-se pelo meu link e comece agora:
https://leadbay.com.br/auth?ref=ABC12345
```

---

## 5. Item no menu do avatar

**Arquivo**: `src/components/UserAvatarMenu.tsx`.

- Adicionar entrada **"Indicar e ganhar"** com ícone `Gift`, abrindo a nova página/modal de link de indicação.

---

## Arquivos afetados

- `src/components/referral/ReferralPopup.tsx` — refatorar (vira card/página, sem auto-open)
- `src/components/Layout.tsx` — remover `<ReferralPopup>` do layout logado
- `src/components/UserAvatarMenu.tsx` — novo item "Indicar e ganhar"
- `src/pages/Auth.tsx` — ler `?ref=` da URL
- `src/components/auth/MultiStepSignup.tsx` — passar `referralCode` da URL
- `src/components/auth/steps/CredentialsStep.tsx` — esconder/desabilitar campo quando vier do link
- `supabase/functions/asaas-webhook/index.ts` — chamar `grant_referral_bonus_if_eligible` após pagamento de assinatura
- **Nova migração SQL** com:
  - `redeem_referral` ajustada (só marca `referred_by`)
  - Nova função `grant_referral_bonus_if_eligible`
  - Backfill opcional para indicações antigas com assinatura paga já ativa

## Resultado esperado

- Popup chato no login: **eliminado**.
- Cada corretor tem um **link único** (`/auth?ref=SEUCODIGO`) que pode compartilhar.
- O bônus de **280 créditos** só cai na conta do indicador **quando o indicado fizer um plano pago** (Essencial, Performance ou Elite). Se o indicado ficar só no plano grátis CONEXÃO, **nenhum crédito é gerado**.
