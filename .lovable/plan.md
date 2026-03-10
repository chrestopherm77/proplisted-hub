

## Voucher aplicável a 1 lead do carrinho (mesmo com múltiplos itens)

### O que muda

Atualmente o voucher só funciona se o carrinho tiver exatamente 1 lead. A mudança permite que o usuário escolha em qual lead aplicar o voucher quando há múltiplos itens. Após resgatar, o lead é entregue grátis e removido do carrinho; os demais seguem para pagamento normalmente.

### Alterações

**`src/pages/Checkout.tsx`**
- Adicionar estado `selectedVoucherLeadId` para o usuário escolher qual lead recebe o voucher
- Se carrinho tem 1 lead: seleciona automaticamente
- Se carrinho tem 2+: mostrar um select/radio para o usuário escolher qual lead usar o voucher
- Remover a restrição `cartItems.length !== 1` do botão Validar
- Remover a mensagem de "remova itens do carrinho"
- Após resgate bem-sucedido com múltiplos leads: em vez do modal de "Parabéns, ir para Meus Leads", mostrar toast de sucesso, remover o lead resgatado do state `cartItems` e continuar no checkout com os itens restantes para pagamento
- Se era o último lead (carrinho ficou vazio após resgate): aí sim mostrar o modal de parabéns com redirect para Meus Leads
- Esconder a seção de voucher após resgate bem-sucedido

**`supabase/functions/redeem-voucher/index.ts`**
- Na etapa 9, remover apenas o lead específico do carrinho (já faz isso — OK, sem mudança necessária)
- Sem mudanças na edge function

### Fluxo do usuário
1. Carrinho com 2 leads → vai ao checkout
2. Seção voucher aparece com dropdown para escolher qual lead
3. Digita código, escolhe lead, clica Validar
4. Lead resgatado é removido do carrinho
5. Toast: "Lead X resgatado com voucher!"
6. Checkout continua normalmente com o(s) lead(s) restante(s) para pagamento

