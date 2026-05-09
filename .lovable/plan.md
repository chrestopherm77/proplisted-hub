## Mudanças

### 1) Modal "Meus Leads" (CRM) — remover resumo do topo
Arquivo: `src/components/myleads/LeadCrmDialog.tsx`

- Remover o bloco que renderiza `parseDescription(lead.description)` no header (texto cinza com "Preferência 1: ..., Preferência 2: ...").
- Remover a função `parseDescription` que ficará sem uso.
- Remover o cabeçalho duplicado "📋 Detalhes do Lead" logo antes do `LeadPreferencesView` (os cards já têm seu próprio título "🎯 Preferência N — ...").
- Manter: nome, badge de etapa, telefone + WhatsApp, e-mail e a seção `LeadPreferencesView`.

### 2) Modal de Leads Disponíveis (marketplace) — remover resumo do topo
Arquivo: `src/components/marketplace/LeadDetailsModal.tsx`

- Remover o cabeçalho duplicado "📋 Detalhes do Lead" antes do `LeadPreferencesView`, mantendo apenas as preferências detalhadas (igual ao CRM).
- Header (Lead #ID, badge de disponibilidade, data para admin) permanece igual.

### 3) Modal de Lead Comprado — mesma limpeza
Arquivo: `src/components/marketplace/PurchasedLeadModal.tsx`

- Remover o bloco `parseDescriptionToDisplay(lead.description)` no header (mesmo resumo redundante).
- Remover a função `parseDescriptionToDisplay`.
- Remover o cabeçalho "📋 Detalhes do Lead" antes do `LeadPreferencesView`.

### 4) Leads esgotados — exibir contagem 5/5
Mostrar o número de compras nos leads marcados como esgotados, incluindo os marcados manualmente (`is_exhausted = true`).

- `src/pages/Leads.tsx` (~linha 626): badge do card passa de `'Esgotado'` para `` `Esgotado ${lead.max_purchases}/${lead.max_purchases}` ``.
- `src/components/marketplace/LeadDetailsModal.tsx` (~linha 110): badge do header passa para `` `Esgotado ${lead.max_purchases}/${lead.max_purchases}` `` quando `isSoldOut`.
- `src/components/marketplace/LeadDetailsModal.tsx` (~linha 154): botão desabilitado passa para `` `Esgotado (${lead.max_purchases}/${lead.max_purchases})` ``.

`isSoldOut` já cobre tanto `purchase_count >= max_purchases` quanto `is_exhausted === true`, então a contagem "5/5" aparece também quando o admin esgota manualmente.

## Fora de escopo
- Sem alterações de banco, RLS ou edge functions.
- Sem mudanças de lógica de compra/preço.
