

## Ocultar nome do lead no Carrinho — usar Lead #ID

A página do Carrinho atualmente exibe o nome e descrição do lead, violando a regra de privacidade. Será atualizada para mostrar apenas o código do lead (Lead #ID), seguindo o mesmo padrão já implementado no checkout.

### Alterações em `src/pages/Cart.tsx`

1. **Título do card (linha 153)**: Substituir `{item.leads.name}` por `Lead #{item.leads.id.slice(0, 8)}`
2. **Descrição do card (linha 164-166)**: Remover o bloco que exibe `{item.leads.description}` — a descrição não deve ser visível antes da compra

### Resultado esperado
Cada item no carrinho mostrará apenas: "Lead #ABC12345", preço e botão de remover. Nenhuma informação identificável do lead será exposta.

