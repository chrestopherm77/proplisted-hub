## Meus Leads — CRM: sempre mostrar Kanban/Tabs, mesmo sem leads

### Alterações em `src/pages/MyLeads.tsx`

1. Remover o early-return do estado vazio (linhas 216–226) que bloqueia a renderização do Kanban quando `leads.length === 0`.
2. Substituir por um **banner informativo discreto** (borda tracejada + bg muted) acima do board quando `leads.length === 0`, com os CTAs:
   - "Explorar Marketplace" → link para `/leads`
   - "Adicionar contato manual" → abre `NewContactDialog`
3. Deixar a renderização Mobile (Tabs) / Desktop (Kanban) sempre ativa. As colunas vazias já tratam o caso `leads.length === 0` internamente mostrando "Sem leads aqui".

### Resultado
- **Desktop**: 7 colunas Kanban sempre visíveis (Entrada, Em Atendimento, Visita, Negociação, Assinatura, Ganho, Perdido).
- **Mobile**: 7 tabs com contador `(0)` sempre visíveis.
- Banner acima do board só quando não há leads.

### Arquivo afetado
- `src/pages/MyLeads.tsx` (única mudança)