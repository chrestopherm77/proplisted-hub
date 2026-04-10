

# Plano: Restringir "Buscar oferta" e "Lançamentos" a MASTER_ADMIN

## Mudanças

### 1. `Layout.tsx` — Menu desktop
- Envolver os links "Buscar oferta" e "Lançamentos" com `{isAdmin && ( ... )}`, igual ao link "Admin"

### 2. `MobileMenu.tsx` — Menu mobile
- Envolver os mesmos dois links com `{isAdmin && ( ... )}`
- O componente já recebe `isAdmin` como prop

### 3. Páginas — Proteção de acesso direto
Nas 6 páginas (`PropertySearches`, `NewPropertySearch`, `PropertySearchDetail`, `Launches`, `NewLaunch`, `LaunchDetail`), adicionar verificação de `isAdmin` do hook `useAuth()`. Se `isAdmin === false`, redirecionar para `/`. Isso impede acesso direto pela URL.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/Layout.tsx` | Condicionar links ao `isAdmin` |
| `src/components/MobileMenu.tsx` | Condicionar links ao `isAdmin` |
| `src/pages/PropertySearches.tsx` | Redirect se não admin |
| `src/pages/NewPropertySearch.tsx` | Redirect se não admin |
| `src/pages/PropertySearchDetail.tsx` | Redirect se não admin |
| `src/pages/Launches.tsx` | Redirect se não admin |
| `src/pages/NewLaunch.tsx` | Redirect se não admin |
| `src/pages/LaunchDetail.tsx` | Redirect se não admin |

