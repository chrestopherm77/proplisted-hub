## Objetivo
Aplicar precificação dupla baseada em assinatura:
- **Pacotes avulsos**: não-assinante paga 2x o preço e recebe 2x os créditos (mantém a relação R$/crédito).
- **Leads**: lead custa 70 créditos para assinantes; para não-assinantes é exibido e cobrado 140 créditos (dobro).
- "Assinante" = qualquer plano pago ativo (já temos `has_active_paid_plan`).

## Mudanças no banco

1. **`credit_packages`** — atualizar os 4 pacotes ativos para representar a oferta do **assinante** (base):
   - 1 Lead: R$14 / 70 cr (já está)
   - 5 Leads: R$65 / 350 cr (já está)
   - 10 Leads: R$115 / 700 cr (já está)
   - 25 Leads: R$250 / 1750 cr (já está)
   
   Nenhuma alteração de schema. A duplicação será aplicada em runtime quando o usuário não for assinante.

2. **`purchase_lead_with_credits` (RPC)** — ajustar para cobrar `price * 2` quando o comprador não tiver plano pago ativo (usando `has_active_paid_plan`). Registrar o valor real debitado em `credit_transactions`.

3. **Helper SQL** novo `get_effective_lead_price(p_user_id, p_lead_id)` (opcional) ou expor `has_active_paid_plan` para o front via select existente — já chamável.

## Mudanças no front

4. **`useSubscriptionLimits` / novo hook `useIsPaidSubscriber`**: expor flag `isPaidSubscriber` (plano com `price > 0` ativo). Admin conta como assinante.

5. **`BuyCredits.tsx`**:
   - Buscar pacotes normalmente.
   - Se `!isPaidSubscriber`, exibir e enviar para checkout valores dobrados (`price*2`, `credits*2`, nome ajustado, ex.: "2 Leads").
   - Banner no topo: "Assine um plano e pague metade do preço por crédito."

6. **`create-credit-purchase` (edge function)**:
   - Receber `packageId` + recalcular server-side: se usuário não tem plano pago ativo, dobrar `price` e `credits` antes de criar o checkout Asaas e o registro em `credit_purchases`. Nunca confiar em valor enviado pelo cliente.
   - `asaas-webhook` ao confirmar usa o `credits` salvo em `credit_purchases` (já é assim) — então basta gravar correto.

7. **`Leads.tsx` + `LeadDetailsModal.tsx`**:
   - Calcular `displayCredits = isPaidSubscriber ? lead.price : lead.price * 2`.
   - Card e modal mostram `displayCredits` cr.
   - Para não-assinante: adicionar CTA/badge "Assine e pague apenas {lead.price} cr" linkando para `/planos`.

8. **Compra com créditos** (`purchase-lead-with-credits` → RPC): já tratada no item 2; UI deve refletir o valor dobrado no botão "Comprar por X créditos".

9. **Compra via dinheiro** (`create-payment`): mesma lógica — server-side, se o usuário não é assinante, dobrar `price` por item antes do checkout e gravar `amount` real em `purchases`. (Hoje o fluxo de dinheiro usa `lead.price` em reais; manter compatível.)

## Pontos de validação
- Admin é tratado como assinante (acesso total já implícito).
- Carrinho (`shopping_cart`) precisa refletir o preço efetivo no resumo — usar mesmo cálculo no `Cart.tsx`.
- `LeadKanbanCard`/CRM não afetados (apenas exibição pós-compra).

## Detalhes técnicos
- Toda decisão de preço é **recalculada no servidor** (RPC e edge functions). O front só exibe.
- Nenhuma migração estrutural; apenas alteração de RPC `purchase_lead_with_credits` e edge functions `create-credit-purchase` e `create-payment`.
- Hook `useIsPaidSubscriber` reutiliza dados já carregados em `useSubscriptionLimits` (`plan.price > 0` ou `isAdmin`).
