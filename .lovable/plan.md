

## Exibir data de cadastro do lead apenas para admins

### Situação atual
- **Usuários (admin)**: A coluna "Cadastro" com `created_at` já existe em `UsersManagement.tsx` — está funcionando.
- **Leads (marketplace)**: O `created_at` não é exibido em nenhum lugar. O select nem busca esse campo.

### Alterações

**1. `src/pages/Leads.tsx`**
- Adicionar `created_at` ao `select` da query de leads
- Adicionar `created_at` à interface `Lead`
- Usar o `isAdmin` do `useAuth()` (já disponível no hook)
- No card do lead, se `isAdmin === true`, exibir a data de cadastro em texto pequeno discreto (ex: "Cadastrado em 15/03/2025")

**2. `src/components/marketplace/LeadDetailsModal.tsx`**
- Adicionar `created_at` à interface `Lead`
- Receber prop `isAdmin` para exibir a data no modal de detalhes também, apenas para admins

### Resultado
- Usuários comuns veem os cards normalmente, sem data
- Admins veem uma linha extra com a data de cadastro do lead

