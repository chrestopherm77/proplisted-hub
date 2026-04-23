## Liberar "Nossa IA" e "Criativos" + abrir botão de Novo Lançamento via WhatsApp

### Mudanças

**1. Sidebar (`src/components/AppSidebar.tsx`)**
- Mudar `show: isAdmin` para `show: true` nos itens **"Nossa IA"** e **"Criativos"**, deixando-os visíveis para todos os usuários autenticados (mantendo `!isPartnerSite` quando aplicável — neste caso não, já que hoje só dependem de `isAdmin`).

**2. Menu Mobile (`src/components/MobileMenu.tsx`)**
- Remover a condição `{isAdmin && (...)}` em volta do link **"Nossa IA"** para que apareça para todos.
- Adicionar o link **"Criativos"** no menu mobile (atualmente nem existe lá), visível para todos.

**3. Página de Lançamentos (`src/pages/Launches.tsx`)**
- Botão **"Novo Lançamento"**:
  - Remover a condição `(isAdmin || isConstrutora)` — botão fica visível para **todos**.
  - Trocar a ação `onClick={() => navigate('/launches/new')}` por abrir WhatsApp em nova aba.
  - Número: `5516992456258` (12 dígitos, padrão do projeto: 55 + DDD 16 + 8 dígitos, sem o 9).
  - Mensagem: `Vim do site da leadbay e quero criar um novo lançamento`.
  - Usar o helper `buildWaLink` de `src/lib/whatsapp.ts` (já existe no projeto e normaliza para 12 dígitos automaticamente).
  - Abrir com `window.open(url, '_blank', 'noopener,noreferrer')`.

### O que NÃO muda
- Permissões reais de criar lançamento na rota `/launches/new` continuam controladas pelo backend/RLS — só o botão de atalho na listagem foi reapontado para WhatsApp.
- Acesso administrativo a `/admin` continua restrito a `isAdmin`.
- Nada muda em backend, RLS, edge functions ou banco.

### Arquivos afetados
- `src/components/AppSidebar.tsx`
- `src/components/MobileMenu.tsx`
- `src/pages/Launches.tsx`
