
# Restringir "Nossa IA" só para admins

## Resumo
O item "Nossa IA" está visível para todos os usuários logados. Vou restringir a visualização **apenas para MASTER_ADMIN** (Chrestopher, Lucas e Gustavo já têm essa role).

## Mudanças

### 1. `src/components/AppSidebar.tsx`
Mudar o `show: true` do item "Nossa IA" para `show: isAdmin` (já existe a flag vinda do `useAuth`).

### 2. `src/components/MobileMenu.tsx`
Envolver o `<Link to="/nossa-ia">` em `{isAdmin && (...)}`.

### 3. `src/pages/NossaIA.tsx`
Adicionar guarda de rota: se `!isAdmin`, redirecionar para `/leads` com toast "Acesso negado". Mesmo padrão usado em `src/pages/Admin.tsx`. Isso impede que um usuário comum acesse digitando a URL diretamente.

## Observação
Não preciso mexer em banco — os 3 usuários solicitados (`chrestopherm@gmail.com`, `lucasphilbr@gmail.com`, `contato@beltramicapital.com.br`) já têm role `MASTER_ADMIN`. A restrição é puramente de UI/rota.

## Arquivos
- editar `src/components/AppSidebar.tsx`
- editar `src/components/MobileMenu.tsx`
- editar `src/pages/NossaIA.tsx`
