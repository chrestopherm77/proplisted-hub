
## Plano: Corrigir Dupla Contagem de Compras no Webhook

### Problema Identificado

O Asaas envia **dois eventos diferentes** para a mesma transação de pagamento:
1. `CHECKOUT_PAID` (confirmação do checkout)
2. `PAYMENT_RECEIVED` (confirmação do pagamento)

Atualmente, o webhook processa ambos os eventos separadamente, e cada um:
- Atualiza o status da compra para `PAID`
- Incrementa o `purchase_count` do lead em +1

Isso resulta em:
- **purchase_count = 2** quando deveria ser **1**
- Inconsistência entre o que aparece no card (1/3) e no modal (2 vendidos)

### Evidência no Banco de Dados

| Campo | Valor |
|-------|-------|
| Lead ID | f6fcdfb7-f9ab-4442-b7b2-1cf52261d3a1 |
| purchase_count na tabela leads | 2 |
| Registros reais na tabela purchases | 1 |

Eventos do webhook processados:
- `CHECKOUT_PAID` às 00:16:31 - processed: true
- `PAYMENT_RECEIVED` às 00:16:29 - processed: true

---

### Solução

**Arquivo a modificar:** `supabase/functions/asaas-webhook/index.ts`

#### 1. Adicionar verificação se a compra já está PAID

Antes de processar qualquer evento de confirmação, verificar se a compra já foi marcada como `PAID`:

```typescript
// Dentro de processPaymentConfirmation, após encontrar as purchases:

for (const purchase of purchases) {
  // NEW: Skip if purchase is already PAID
  if (purchase.status === 'PAID') {
    console.log('⏭️ Purchase already PAID, skipping:', purchase.id);
    continue;
  }
  
  // ... resto do processamento
}
```

#### 2. Localização exata da alteração

**Linha 305-306** (início do loop `for`):

Adicionar verificação logo após `for (const purchase of purchases) {`:

```typescript
for (const purchase of purchases) {
  // Check if purchase is already PAID to prevent double processing
  if (purchase.status === 'PAID') {
    console.log('⏭️ Purchase already PAID, skipping:', purchase.id);
    continue;
  }
  
  console.log('Processing purchase:', purchase.id);
  // ... resto do código
}
```

---

### Correção do Dado Incorreto

Além de corrigir o código, será necessário corrigir o `purchase_count` do lead afetado no banco de dados:

**Opção 1:** Executar manualmente via Cloud View > Run SQL:
```sql
UPDATE leads 
SET purchase_count = 1 
WHERE id = 'f6fcdfb7-f9ab-4442-b7b2-1cf52261d3a1';
```

**Opção 2:** Eu posso incluir uma migração para corrigir automaticamente.

---

### Fluxo Corrigido

```text
ANTES (problemático):
1. PAYMENT_RECEIVED → processPaymentConfirmation → purchase_count = 1
2. CHECKOUT_PAID → processPaymentConfirmation → purchase_count = 2 ❌

DEPOIS (corrigido):
1. PAYMENT_RECEIVED → processPaymentConfirmation → purchase.status = 'PAID', purchase_count = 1
2. CHECKOUT_PAID → processPaymentConfirmation → purchase.status já é 'PAID' → skip ✅
```

---

### Detalhes Técnicos

| Item | Valor |
|------|-------|
| Arquivo | `supabase/functions/asaas-webhook/index.ts` |
| Função | `processPaymentConfirmation` |
| Linha | 305 |
| Tipo de alteração | Adicionar verificação de idempotência por status |

---

### Sobre a Exibição no Modal

A diferença entre o card e o modal acontece porque:

**Card (Leads.tsx):**
```tsx
{lead.max_purchases - lead.purchase_count}/{lead.max_purchases} disponíveis
// Com purchase_count = 2: "1/3 disponíveis"
```

**Modal (LeadDetailsModal.tsx):**
```tsx
<p className="text-sm font-medium">{lead.purchase_count} vendidos</p>
// Com purchase_count = 2: "2 vendidos"
```

Após corrigir o `purchase_count` para 1, ambos mostrarão valores consistentes:
- Card: "2/3 disponíveis"
- Modal: "1 vendidos"

---

### Resumo das Alterações

1. **Edge Function** (`asaas-webhook/index.ts`): Adicionar verificação `if (purchase.status === 'PAID') continue;`
2. **Correção de dados**: Atualizar o `purchase_count` do lead afetado para o valor correto
