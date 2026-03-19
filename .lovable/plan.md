

## Sistema de Cupom de Desconto

### Visão geral

Criar cupons de desconto percentual que funcionam junto aos vouchers existentes. No admin, ao criar um novo código, o admin escolhe se é "Voucher" (lead grátis) ou "Cupom" (desconto %). No checkout, o usuário pode aplicar um cupom para reduzir o valor total antes de pagar.

### 1. Criar tabela `coupons` (migração)

```sql
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  is_active boolean DEFAULT true,
  max_uses integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Admins gerenciam
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'MASTER_ADMIN'));

-- Usuários autenticados podem ler cupons ativos
CREATE POLICY "Authenticated can read active coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (is_active = true);

-- Tabela de uso de cupons
CREATE TABLE public.coupon_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id),
  user_id uuid NOT NULL,
  used_at timestamptz DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupon usages"
  ON public.coupon_usages FOR ALL
  USING (has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Users can view own usages"
  ON public.coupon_usages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usages"
  ON public.coupon_usages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### 2. Atualizar `VouchersManagement.tsx`

- Adicionar seletor "Tipo: Voucher / Cupom" no formulário de criação
- Se "Cupom", mostrar campo de porcentagem de desconto (1-100%)
- Listar cupons junto com vouchers, diferenciando por badge ("Voucher" vs "Cupom 20%")
- Cupons mostram contagem de usos similar aos vouchers

### 3. Criar edge function `validate-coupon`

- Recebe `couponCode` no body
- Valida: código existe, está ativo, não atingiu max_uses, usuário não usou ainda
- Retorna `{ success: true, discount_percent: 20 }` sem consumir o uso (uso é registrado no pagamento)

### 4. Atualizar `Checkout.tsx`

- Adicionar seção "Cupom de Desconto" abaixo do voucher (campo + botão "Aplicar")
- Ao validar, mostrar desconto aplicado no resumo (valor original riscado + valor com desconto)
- Guardar `couponCode` e `discountPercent` no state
- Enviar `couponCode` para `create-payment` ao finalizar

### 5. Atualizar `create-payment` edge function

- Receber `couponCode` opcional
- Se presente: validar cupom no banco (existe, ativo, max_uses, não usado pelo usuário)
- Aplicar desconto percentual ao total calculado do banco
- Registrar uso na tabela `coupon_usages`
- Enviar valor com desconto ao Asaas

### Resultado

- Admin cria vouchers (lead grátis) ou cupons (desconto %) na mesma tela
- Usuário aplica cupom no checkout e vê o desconto refletido no total
- Validação de segurança no servidor (preço sempre calculado no backend)

