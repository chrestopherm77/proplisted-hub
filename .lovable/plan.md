

## Plano: Criar Novo Admin + Visualizar Corretores no Painel

### Parte 1: Criar Novo Administrador

**Problema:** Precisamos criar um usuario com email `contato@beltramicapital.com.br` e senha `Beltrami@77` com permissao MASTER_ADMIN.

**Solucao:** Criar uma Edge Function temporaria (`create-admin-user`) que usa a service role key para:
1. Criar o usuario no sistema de autenticacao
2. Atribuir a role `MASTER_ADMIN` na tabela `user_roles`
3. Criar o perfil na tabela `profiles`

Depois de executar, a funcao sera removida por seguranca.

| Passo | Acao |
|-------|------|
| 1 | Criar Edge Function `create-admin-user` |
| 2 | Executar a funcao para criar o usuario |
| 3 | Verificar que o usuario foi criado corretamente |
| 4 | Remover a Edge Function (seguranca) |

---

### Parte 2: Visualizar Corretores Cadastrados

**Problema:** O card "Usuarios" no dashboard mostra apenas o numero. Ao clicar, precisa mostrar todos os dados dos corretores.

**Solucao:** Tornar o card "Usuarios" clicavel e ao clicar, abrir um modal/secao com uma tabela listando todos os perfis cadastrados com todas as informacoes.

**Informacoes exibidas na tabela:**

| Coluna | Campo |
|--------|-------|
| Nome | `name` / `company_name` |
| Tipo | `person_type` (PF/PJ) |
| Telefone | `phone` |
| Email | (do auth, via join ou metadata) |
| CPF/CNPJ | `cpf` / `cnpj` |
| Profissao | `profession` |
| CRECI | `creci` + `creci_uf` |
| CAU | `cau` + `cau_uf` |
| CREA | `crea` + `crea_uf` |
| UF/Cidade | `address_uf` / `address_city` |
| Bairro | `address_neighborhood` |
| Data Cadastro | `created_at` |

**Implementacao:**
- Criar componente `UsersManagement.tsx` em `src/components/admin/`
- No `DashboardStats.tsx`, tornar o card "Usuarios" clicavel
- Ao clicar, mostrar um Dialog/Modal com a tabela completa
- Incluir busca por nome/telefone para facilitar a localizacao

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/create-admin-user/index.ts` | Criar (temporario) |
| `src/components/admin/UsersManagement.tsx` | Criar - componente com tabela de usuarios |
| `src/components/admin/DashboardStats.tsx` | Modificar - card "Usuarios" clicavel, abre modal |

---

### Detalhes Tecnicos

**Edge Function `create-admin-user`:**
- Usa `createClient` com `SUPABASE_SERVICE_ROLE_KEY` para ter acesso admin
- Chama `auth.admin.createUser()` com email, password e `email_confirm: true`
- Insere role `MASTER_ADMIN` na tabela `user_roles`
- Protegida por verificacao de secret no header para evitar uso indevido

**Componente `UsersManagement`:**
- Busca todos os perfis via `supabase.from('profiles').select('*')` (admin tem RLS para ver todos)
- Tabela responsiva com scroll horizontal no mobile
- Campo de busca para filtrar por nome ou telefone
- Labels traduzidos para profissao (CORRETOR -> Corretor, ARQUITETO -> Arquiteto, etc.)
- Exibe dados de PF e PJ de forma condicional

