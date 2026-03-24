

## Mostrar forma de pagamento completa (método + cupom juntos)

### Problema
Atualmente o `getPaymentBadge` mostra OU o método OU o cupom, mas não os dois juntos. Se a pessoa pagou com PIX e usou cupom, só mostra "PIX" sem o código do cupom.

### Alteração em `src/components/admin/PurchasesOverview.tsx`

Reescrever `getPaymentBadge` para mostrar **ambas** as informações quando existirem:

- **Método de pagamento** (PIX, Cartão, Voucher) → sempre exibido como badge colorido
- **Cupom usado** → exibido abaixo do método como texto pequeno com o código
- **Compras antigas sem info** → inferir: se `amount = 0` → "Voucher", senão → "—"

Exemplo visual:
- PIX + cupom DESCONTO20 → Badge "PIX" + texto "Cupom: DESCONTO20"
- Voucher com código → Badge "Voucher" + texto com código
- Cartão sem cupom → Badge "Cartão"

