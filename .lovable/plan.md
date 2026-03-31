

# Plano: Botão "Esgotar Lead" com visibilidade no marketplace

## Problema atual
O marketplace só busca leads com `is_active = true`. Quando um lead é esgotado (via `purchase_count = max_purchases`), ele fica com `is_active = false` e desaparece do marketplace. O usuário quer que leads esgotados continuem visíveis, mas sem possibilidade de compra.

## Solução

### 1. Nova coluna `is_exhausted` na tabela `leads`
- Adicionar campo booleano `is_exhausted` (default `false`)
- Separar o conceito de "esgotado manualmente" de "inativo/oculto"

### 2. Alterar query do marketplace (`src/pages/Leads.tsx`)
- Mudar de `.eq('is_active', true)` para: buscar leads onde `is_active = true` **OU** `is_exhausted = true`
- Isso garante que leads esgotados manualmente ainda apareçam

### 3. Bloquear compra de leads esgotados
- Atualizar `isSoldOut` para considerar `is_exhausted`: `lead.purchase_count >= lead.max_purchases || lead.is_exhausted`
- O card já mostra badge "Esgotado" e o modal já bloqueia compra quando `isSoldOut = true` — isso se mantém
- Atualizar a interface `Lead` nos arquivos relevantes para incluir `is_exhausted`

### 4. Botão "Esgotar" no admin (`src/components/admin/LeadsManagement.tsx`)
- Adicionar função `exhaustLead(lead)` que faz `update({ is_exhausted: true })` no lead
- Botão com ícone `Ban` na linha de ações, visível apenas se `!lead.is_exhausted`
- Badge "Esgotado" (vermelho) no card do admin quando `is_exhausted = true`
- Botão reverso para "reativar" caso o admin queira desfazer

### 5. RLS
- A policy existente "Anyone authenticated can view active leads" filtra `is_active = true`
- Adicionar nova policy: "Anyone authenticated can view exhausted leads" com `is_exhausted = true`

### Arquivos afetados
| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `ALTER TABLE leads ADD COLUMN is_exhausted boolean DEFAULT false` + nova RLS policy |
| `src/pages/Leads.tsx` | Query inclui exhausted; `isSoldOut` considera `is_exhausted`; interface `Lead` atualizada |
| `src/components/marketplace/LeadDetailsModal.tsx` | Interface `Lead` com `is_exhausted` |
| `src/components/admin/LeadsManagement.tsx` | Botão esgotar/reativar + badge |

