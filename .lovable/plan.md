## Objetivo
Garantir que após o cadastro (plano Free) **e** após pagamento de planos pagos, o usuário seja redirecionado para `/primeiros-passos`.

## Estado atual
- **Cadastro (plano Free)**: já redireciona para `/primeiros-passos` corretamente (`MultiStepSignup.tsx` linha 463). Nenhuma mudança necessária aqui.
- **Pagamento de plano pago**: o `CheckoutSuccess.tsx` redireciona para `/my-leads` quando `type !== 'credits'`. Precisa mudar para `/primeiros-passos`.
- **Compra de créditos avulsos**: redireciona para `/leads`. **Manter como está** (não é assinatura de plano).

## Mudanças

### `src/pages/CheckoutSuccess.tsx`
Trocar o destino de planos pagos de `/my-leads` para `/primeiros-passos`:

1. **Linha 145** — countdown de redirecionamento:
   - De: `const target = isCredits ? '/leads' : '/my-leads';`
   - Para: `const target = isCredits ? '/leads' : '/primeiros-passos';`

2. **Linha 159** — destino do botão e label:
   - `redirectTarget`: `isCredits ? '/leads' : '/primeiros-passos'`
   - `redirectLabel`: `isCredits ? 'Ver leads disponíveis' : 'Ir para Primeiros Passos'`

A lógica de polling, créditos avulsos e botões de fallback (linha 206 — "Ir para leads disponíveis" no caso de pagamento de créditos não confirmado) permanecem inalterados.

## Resumo do fluxo final
- Cadastro Free → `/primeiros-passos` (já funciona)
- Pagamento de plano pago confirmado → `/primeiros-passos` (novo)
- Compra de créditos avulsos confirmada → `/leads` (mantido)
