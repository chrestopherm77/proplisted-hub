

## Adicionar info de pagamento/cupom/voucher no Histórico de Compras

### O que muda

Adicionar colunas `payment_method` e `coupon_code` na tabela `purchases` para registrar como cada compra foi feita. No painel admin, mostrar uma nova coluna "Forma" indicando: PIX, Cartão, Voucher ou Cupom (com código).

### 1. Migração — adicionar colunas à tabela `purchases`

```sql
ALTER TABLE public.purchases ADD COLUMN payment_method text;
ALTER TABLE public.purchases ADD COLUMN coupon_code text;
```

### 2. Atualizar `create-payment` edge function

- Ao inserir purchase, salvar `payment_method` (PIX/CREDIT_CARD) e `coupon_code` (se aplicado)

### 3. Atualizar `redeem-voucher` edge function

- Ao inserir purchase de voucher, salvar `payment_method = 'VOUCHER'` e `coupon_code = voucherCode`

### 4. Atualizar `PurchasesOverview.tsx`

- Buscar `payment_method` e `coupon_code` na query
- Adicionar coluna "Forma" na tabela com badges:
  - `VOUCHER` → Badge "Voucher" (roxo) + código
  - `PIX` → Badge "PIX" (verde)
  - `CREDIT_CARD` → Badge "Cartão" (azul)
  - Se `coupon_code` e não voucher → mostrar "Cupom: CÓDIGO"
  - `null` (compras antigas) → "—"

### 5. Cross-reference compras antigas (opcional)

- Compras com `amount = 0` e existentes em `voucher_redemptions` → foram voucher
- Demais compras antigas ficam sem info (exibem "—")

