## Botão de FAQ no header

Adicionar um botão circular com ícone de interrogação (`HelpCircle`) ao lado do `UserAvatarMenu` no header — visível em desktop e mobile. Ao clicar, abre um painel lateral (Sheet) com um FAQ completo organizado por categorias.

### Componente novo: `src/components/FaqButton.tsx`

- Botão `ghost` redondo com ícone `HelpCircle` (lucide-react), `aria-label="Perguntas frequentes"`.
- Abre um `Sheet` (lado direito no desktop, full-width no mobile, largura ~480px).
- Cabeçalho do sheet: título "Central de Ajuda" + subtítulo.
- Campo de busca no topo (filtra perguntas/respostas em tempo real, case-insensitive).
- Conteúdo: `Accordion` (shadcn) agrupado por categoria, com badge de categoria.
- Rodapé do sheet: link rápido "Falar com suporte" que dispara o `SupportChatWidget` existente (via evento custom `open-support-chat`) ou redireciona para `/suporte` se a rota existir.

### Conteúdo do FAQ (categorias e perguntas)

1. **Conta e cadastro**
  - Como criar minha conta?
  - Posso ter mais de uma conta com o mesmo telefone? (limite de 1)
  - Como verificar meu CRECI/CAU/CREA?
  - Esqueci minha senha, como redefinir?
  - Como atualizar meus dados de perfil?
2. **Leads e marketplace**
  - O que é o Marketplace de Leads?
  - Como compro um lead?
  - Quantos parceiros podem comprar o mesmo lead? (até 5)
  - Por que alguns dados do lead ficam ocultos antes da compra?
  - Como funciona o reembolso/contestação de leads?
  - O que significa "lead esgotado"?
3. **Pagamentos e créditos**
  - Quais formas de pagamento são aceitas?
  - Como funcionam os créditos da plataforma?
  - Onde vejo minhas faturas e recibos?
4. **Lançamentos e parcerias**
  - Como cadastro um lançamento?
  - Como funciona o "Balcão de Parcerias"?
  - Posso indicar parceiros para um lançamento?
5. **Portal do corretor (White Label)**
  - O que é o Portal do Corretor?
  - Posso usar meus imoveis no portal ?
  - Posso anunciar imoveis de outros corretores ?
6. **Integrações**
  - Como funcionam as notificações por email?
  - Posso integrar com meu CRM?
7. **Suporte e segurança**
  - Como falo com o suporte?
  - Meus dados estão seguros?
  - Como excluir minha conta?

Cada pergunta terá resposta de 2-5 linhas em português, tom claro e direto.

### Integração no Layout

Em `src/components/Layout.tsx`, dentro do header (linha 71-73), inserir `<FaqButton />` antes do `<UserAvatarMenu />`. Como o mesmo header serve mobile + desktop, isso cobre os dois casos automaticamente.

### Detalhes técnicos

- Reutiliza componentes shadcn já presentes: `Sheet`, `Accordion`, `Input`, `Button`, `Badge`, `ScrollArea`.
- Estrutura de dados local: array `FAQ_CATEGORIES` no próprio arquivo (sem necessidade de tabela).
- Filtro de busca: normaliza acentos via `String.prototype.normalize('NFD')` antes de comparar.
- `translate="no"` no root do sheet (regra de UI 100% PT-BR).
- Sem dependências novas.

### Arquivos

**Criar**

- `src/components/FaqButton.tsx`

**Editar**

- `src/components/Layout.tsx` (adicionar `<FaqButton />` antes do `<UserAvatarMenu />`)