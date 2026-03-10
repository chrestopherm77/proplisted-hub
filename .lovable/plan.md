

## Mostrar "Você já comprou este lead" no Marketplace

### O que muda
Quando o usuário já comprou um lead (status PAID), o card e o modal devem indicar isso claramente, impedindo compra duplicada.

### Alterações em `src/pages/Leads.tsx`

1. **Buscar purchases do usuário** — no `useEffect`, fazer query em `purchases` filtrando `user_id` e `status = 'PAID'`, armazenar os `lead_id`s num state `purchasedLeadIds: string[]`
2. **Helper `isPurchased(leadId)`** — verifica se o lead está na lista
3. **Card do lead** — se `isPurchased`:
   - Mostrar badge "Já comprado" (verde) no lugar do badge "No carrinho"
   - Desabilitar click de adicionar ao carrinho
4. **Passar `isPurchased` ao `LeadDetailsModal`** — para que o modal também mostre o status e desabilite o botão de compra

### Alterações em `src/components/marketplace/LeadDetailsModal.tsx`

1. Receber nova prop `isPurchased: boolean`
2. Se `isPurchased`: mostrar badge "Você já comprou este lead" e esconder/desabilitar botão de adicionar ao carrinho

### Fluxo
- Usuário abre marketplace → sistema carrega leads + purchases do usuário
- Leads já comprados aparecem com badge "Já comprado"
- Ao clicar, modal mostra aviso e não permite adicionar ao carrinho

