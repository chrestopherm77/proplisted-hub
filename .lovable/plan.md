

## Sistema de Vouchers para Leads Grátis

### Visão Geral
Criar um sistema de vouchers que permite ao comprador resgatar 1 lead grátis. O voucher é validado na página de checkout e, se aprovado, o lead é entregue instantaneamente sem pagamento.

### 1. Nova tabela: `vouchers`
```sql
- id (uuid, PK)
- code (text, unique, not null) -- nome/código do voucher
- is_active (boolean, default true)
- max_uses (integer, default 1) -- quantas vezes pode ser usado no total
- created_at (timestamp)
```

### 2. Nova tabela: `voucher_redemptions`
```sql
- id (uuid, PK)
- voucher_id (uuid, FK -> vouchers)
- user_id (uuid, FK -> auth.users)
- lead_id (uuid, FK -> leads)
- redeemed_at (timestamp, default now())
```
- RLS: admin pode ver tudo; user autenticado pode inserir (com user_id = auth.uid())

### 3. Nova Edge Function: `redeem-voucher`
Recebe: `{ voucherCode, leadId, userId }`
- Valida se o voucher existe e está ativo
- Verifica se o total de redemptions < max_uses
- Verifica se o usuário já usou algum voucher antes (1 uso por usuário)
- Verifica se o lead está ativo e disponível
- Se válido: cria purchase (status PAID, amount 0), cria voucher_redemption, incrementa purchase_count do lead, remove do carrinho
- Retorna sucesso ou erro

### 4. Alteração no Checkout (`src/pages/Checkout.tsx`)
- Adicionar seção "Voucher de Lead" acima do formulário de pagamento
- Campo de texto para código do voucher + botão "Validar"
- Se voucher válido e carrinho tem apenas 1 lead: chamar edge function `redeem-voucher`
- Mostrar modal/tela de sucesso "Parabéns! Você ganhou este lead!" com botão para ir a "Meus Leads"
- Se carrinho tem mais de 1 lead, mostrar mensagem que voucher vale para 1 lead apenas

### 5. Nova aba no Admin (`src/pages/Admin.tsx`)
- Adicionar aba "Vouchers" (grid-cols-6)
- Novo componente `src/components/admin/VouchersManagement.tsx`:
  - Formulário para criar novo voucher (código + max_uses)
  - Lista de vouchers existentes com status (ativo/inativo), total de usos
  - Expandir para ver quem usou (user, lead, data)
  - Toggle para ativar/desativar voucher

### Arquivos
- **SQL**: criar tabelas `vouchers` e `voucher_redemptions` com RLS
- **Nova edge function**: `supabase/functions/redeem-voucher/index.ts`
- **Novo componente**: `src/components/admin/VouchersManagement.tsx`
- **Editar**: `src/pages/Checkout.tsx` (seção voucher)
- **Editar**: `src/pages/Admin.tsx` (nova aba)
- **Editar**: `supabase/config.toml` (registrar edge function)

