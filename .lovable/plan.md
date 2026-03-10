

## Ocultar nomes de leads no Checkout — usar Lead #ID

O nome do lead nunca deve ser exibido antes da compra. Todas as referências a `item.leads.name` no Checkout serão substituídas por `Lead #${item.leads.id.slice(0,8)}` (ou o ID curto do lead).

### Alterações em `src/pages/Checkout.tsx`

1. **Dropdown do voucher (linha 401)**: `{item.leads.name}` → `Lead #{item.leads.id.slice(0,8)}`
2. **Toast de resgate (linha 307)**: `Lead "${redeemedItem?.leads.name}"` → `Lead #${redeemedItem?.leads.id.slice(0,8)}`
3. **Resumo do pedido (linha 467)**: `{item.leads.name}` → `Lead #{item.leads.id.slice(0,8)}`
4. **Descrição no resumo (linha 469)**: remover ou substituir `{item.leads.description}` por info genérica (ex: região/interesse se disponível, ou remover a linha)
5. **Payload do pagamento (linha 334)**: manter `name` no body para o backend — isso é interno e não visível ao usuário

Nenhuma outra alteração necessária.

