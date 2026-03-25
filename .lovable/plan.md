

## Tornar a data de cadastro mais visível

### Problema
A coluna "Cadastro" existe no código de `UsersManagement.tsx`, mas é a última de 11 colunas — fica escondida fora da tela, exigindo scroll horizontal. O usuário não consegue vê-la.

### Solução

**1. `src/components/admin/UsersManagement.tsx`**
- Mover a coluna "Cadastro" para uma posição mais visível — logo após "Nome" (segunda coluna), antes de "E-mail"
- Isso garante que a data de cadastro apareça sem precisar rolar

**2. Verificação dos leads (marketplace)**
- O código em `Leads.tsx` já exibe "Cadastrado em..." para admins nos cards e no modal
- Confirmar que o `isAdmin` está retornando `true` corretamente — se não estiver logado como admin, a data não aparece (comportamento esperado)

### Resultado
- Na aba Usuários do admin, a data de cadastro aparece logo na segunda coluna, sempre visível
- Nos leads do marketplace, a data continua aparecendo apenas para admins

