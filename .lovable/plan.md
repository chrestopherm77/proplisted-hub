

# Botão "Não consegui contato" nos Meus Leads

## Resumo
Adicionar um botão no card e no modal de cada lead comprado que, ao clicar, abre o WhatsApp Web/App com uma mensagem pré-preenchida para o número +55 31 9247-2750 informando que o corretor não conseguiu contato com o lead.

## Alterações

### 1. `src/pages/MyLeads.tsx`
- Buscar dados do perfil do usuário logado (name, phone) da tabela `profiles`
- No card de cada lead, adicionar botão "Não consegui contato" com ícone de WhatsApp
- O botão usa `window.open()` com link `https://wa.me/553192472750?text=...`
- Mensagem: "Olá, sou o corretor {nome do corretor} ({telefone do corretor}) e não consegui contato com o Lead {nome do lead}."
- `e.stopPropagation()` no botão para não abrir o modal ao clicar

### 2. `src/components/marketplace/PurchasedLeadModal.tsx`
- Receber props extras: `userName` e `userPhone`
- Adicionar o mesmo botão no footer do modal, ao lado das informações de compra
- Mesma lógica de link WhatsApp

Nenhuma alteração de backend necessária — é apenas um link `wa.me`.

