

# Plano: Sistema de Créditos LeadBay

## Resumo

Migrar o modelo de compra de leads para um sistema baseado em créditos. Usuários compram pacotes de créditos via Asaas (checkout atual) e usam créditos para adquirir leads diretamente (sem gateway de pagamento).

## Fluxo novo

```text
Usuário logado
    │
    ├─► Página "Leads Disponíveis"
    │     → Botão destacado "Compre Créditos" (amarelo)
    │     → Saldo de créditos visível
    │     → Preço dos leads em créditos (ex: "140 créditos")
    │     → Ao clicar "Comprar", desconta créditos instantaneamente
    │
    └─► Modal/Página "Compre Créditos"
          → 6 pacotes disponíveis
          → Seleciona pacote → Checkout Asaas (fluxo atual)
          → Webhook confirma pagamento → credita saldo
```

## Pacotes de créditos

| Pacote | Preço (R$) | Créditos | Créditos/Lead |
|--------|-----------|----------|---------------|
| 1 lead | R$ 28 | 140 | 140 |
| 5 leads | R$ 125 | 625 | 125 |
| 10 leads | R$ 220 | 1.100 | 110 |
| 15 leads | R$ 300 | 1.500 | 100 |
| 25 leads | R$ 475 | 2.375 | 95 |
| 50 leads | R$ 850 | 4.250 | 85 |

## Mudanças necessárias

### 1. Migration: nova tabela `credit_packages` e coluna `credit_balance` em profiles

```sql
-- Saldo de créditos no perfil
ALTER TABLE public.profiles ADD COLUMN credit_balance integer NOT NULL DEFAULT 0;

-- Pacotes de créditos
CREATE TABLE public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  credits integer NOT NULL,
  lead_count integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Todos podem ver pacotes ativos
CREATE POLICY "Anyone can view active packages" ON public.credit_packages
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage packages" ON public.credit_packages
  FOR ALL TO public USING (has_role(auth.uid(), 'MASTER_ADMIN'));

-- Histórico de compras de créditos
CREATE TABLE public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid REFERENCES public.credit_packages(id),
  credits integer NOT NULL,
  amount numeric NOT NULL,
  asaas_checkout_id text,
  asaas_payment_id text,
  status text DEFAULT 'PENDING',
  payment_method text,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit purchases" ON public.credit_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage credit purchases" ON public.credit_purchases
  FOR ALL TO public USING (has_role(auth.uid(), 'MASTER_ADMIN'));

-- Histórico de uso de créditos (ao comprar leads)
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid,
  credits_used integer NOT NULL,
  type text NOT NULL DEFAULT 'LEAD_PURCHASE',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage transactions" ON public.credit_transactions
  FOR ALL TO public USING (has_role(auth.uid(), 'MASTER_ADMIN'));

-- Inserir pacotes
INSERT INTO public.credit_packages (name, price, credits, lead_count) VALUES
  ('Pacote 1 Lead', 28, 140, 1),
  ('Pacote 5 Leads', 125, 625, 5),
  ('Pacote 10 Leads', 220, 1100, 10),
  ('Pacote 15 Leads', 300, 1500, 15),
  ('Pacote 25 Leads', 475, 2375, 25),
  ('Pacote 50 Leads', 850, 4250, 50);
```

### 2. Leads: preço em créditos

O campo `price` dos leads passa a representar créditos (ex: 140 créditos por lead). Leads existentes terão seus preços convertidos automaticamente (price * 5).

### 3. Nova edge function: `create-credit-purchase`

- Recebe: `packageId`, `paymentMethod`, `customerData`
- Busca o pacote, valida, cria checkout Asaas com o valor em R$
- Cria registro em `credit_purchases` com status PENDING
- Retorna URL do checkout

### 4. Alterar `asaas-webhook/index.ts`

- Ao confirmar pagamento, verificar se é compra de crédito (via `credit_purchases`) ou lead (via `purchases`)
- Se for crédito: atualizar `credit_purchases.status = 'PAID'`, adicionar créditos ao `profiles.credit_balance`

### 5. Nova edge function: `purchase-lead-with-credits`

- Recebe: `leadId`
- Verifica saldo de créditos do usuário
- Verifica lead ativo e disponível
- Desconta créditos atomicamente (UPDATE profiles SET credit_balance = credit_balance - X)
- Cria registro em `purchases` com status PAID e payment_method = 'CREDITS'
- Registra em `credit_transactions`
- Incrementa `purchase_count` do lead

### 6. Frontend: `src/pages/Leads.tsx`

- Mostrar saldo de créditos do usuário no topo
- Botão destacado "Compre Créditos" em amarelo perto dos filtros
- Preço dos leads em créditos (não mais R$)
- Botão "Comprar" no card do lead desconta créditos diretamente (sem carrinho)
- Se saldo insuficiente, redireciona para compra de créditos

### 7. Nova página: `src/pages/BuyCredits.tsx`

- Lista os 6 pacotes com visual atrativo (cards com destaque no melhor custo-benefício)
- Ao selecionar pacote, vai para checkout Asaas (reutiliza formulário de dados do Checkout atual)

### 8. Simplificar fluxo do carrinho

- Carrinho e checkout de leads mudam: ao confirmar, desconta créditos
- Remove necessidade de ir ao Asaas para comprar lead
- Vouchers e cupons continuam funcionando (aplicados sobre créditos ou como créditos grátis)

### 9. Sidebar e navegação

- Adicionar link "Comprar Créditos" na sidebar
- Mostrar saldo de créditos na sidebar

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabelas e coluna |
| `supabase/functions/create-credit-purchase/index.ts` | **Novo** |
| `supabase/functions/purchase-lead-with-credits/index.ts` | **Novo** |
| `supabase/functions/asaas-webhook/index.ts` | Alterar (detectar compra de crédito) |
| `src/pages/Leads.tsx` | Alterar (créditos, botão comprar direto) |
| `src/pages/BuyCredits.tsx` | **Novo** |
| `src/pages/Cart.tsx` | Alterar (compra via créditos) |
| `src/pages/Checkout.tsx` | Alterar (checkout agora é para créditos) |
| `src/App.tsx` | Adicionar rota `/comprar-creditos` |
| `src/components/AppSidebar.tsx` | Mostrar saldo e link |
| `src/components/FloatingCart.tsx` | Ajustar |
| `src/components/marketplace/LeadDetailsModal.tsx` | Preço em créditos |
| `src/components/admin/LeadsManagement.tsx` | Preço em créditos |

