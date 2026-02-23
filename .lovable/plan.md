

## Tela de Usuarios no Painel Admin

### O que sera feito

Adicionar uma aba "Usuarios" no painel administrativo com listagem completa de todos os usuarios cadastrados, mostrando todas as informacoes de perfil e com a opcao de inativar/ativar cada usuario. Usuarios inativos serao bloqueados no login.

### Alteracoes

| Arquivo | O que muda |
|---|---|
| **Migracao SQL** | Adicionar coluna `is_active` (boolean, default true) na tabela `profiles` |
| `src/pages/Admin.tsx` | Adicionar 4a aba "Usuarios" no TabsList |
| `src/components/admin/UsersManagement.tsx` | Reescrever: de modal para componente de aba completa, com tabela detalhada, busca, e botao de ativar/inativar por usuario |
| `src/components/admin/DashboardStats.tsx` | Remover a referencia ao modal UsersManagement (o card de usuarios nao abrira mais modal, pois agora e uma aba) |
| `src/pages/Auth.tsx` | Apos login bem-sucedido, verificar se o perfil esta ativo antes de permitir acesso |

### Detalhes tecnicos

**1. Migracao - Nova coluna `is_active` na tabela `profiles`**
```text
ALTER TABLE public.profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
```
Todos os usuarios existentes ficam ativos por padrao.

**2. Admin.tsx - Nova aba**
- Mudar o grid de 3 para 4 colunas no TabsList
- Adicionar `<TabsTrigger value="users">Usuarios</TabsTrigger>`
- Adicionar `<TabsContent value="users"><UsersManagement /></TabsContent>`

**3. UsersManagement.tsx - Reescrita completa**
- Deixa de ser um Dialog/modal e passa a ser um componente de pagina completa (como LeadsManagement)
- Busca todos os perfis com `supabase.from('profiles').select(...)` incluindo o e-mail via join com dados do auth (ou exibindo o e-mail salvo)
- Tabela com colunas: Nome/Razao Social, E-mail, Telefone, Tipo (PF/PJ), CPF/CNPJ, Profissao, Registro (CRECI/CAU/CREA), UF/Cidade, Bairro, Status (Ativo/Inativo), Data de Cadastro
- Campo de busca por nome, telefone ou empresa
- Botao de toggle (Switch) em cada linha para ativar/inativar o usuario
- Ao inativar: `supabase.from('profiles').update({ is_active: false }).eq('id', userId)`
- Badge colorido mostrando status: verde para Ativo, vermelho para Inativo
- Para obter o e-mail dos usuarios, sera criada uma edge function `list-users` que usa a Admin API (`supabase.auth.admin.listUsers()`) e retorna id + email, que o frontend cruza com os perfis

**4. Edge Function `list-users`**
- Nova edge function protegida (apenas admin pode chamar)
- Usa `supabase.auth.admin.listUsers()` para retornar a lista de {id, email} de todos os usuarios
- O frontend faz merge dos emails com os dados de profiles

**5. DashboardStats.tsx**
- Remover o estado `showUsers` e o componente `<UsersManagement open={...} />`
- O card de Usuarios perde o `onClick` e `cursor-pointer` (ou redireciona para a aba)

**6. Auth.tsx - Bloqueio de login para inativos**
- Apos `signInWithPassword` com sucesso, buscar o perfil do usuario
- Se `is_active === false`: fazer `signOut()`, exibir toast "Sua conta foi desativada. Entre em contato com o suporte." e nao redirecionar
- Se ativo: prosseguir normalmente

### Fluxo de inativacao

```text
1. Admin acessa /admin -> aba "Usuarios"
2. Ve a lista completa de todos os usuarios com todas as informacoes
3. Clica no switch de um usuario para inativa-lo
4. Profile e atualizado com is_active = false
5. Na proxima tentativa de login desse usuario:
   - Login no Supabase funciona (credenciais validas)
   - Frontend verifica is_active no perfil
   - Se false: faz signOut, exibe mensagem de conta desativada
   - Usuario nao consegue acessar o sistema
```

### Informacoes exibidas por usuario

- Nome ou Razao Social
- E-mail (vindo da edge function list-users)
- Telefone
- Tipo: PF ou PJ
- CPF ou CNPJ
- Profissao (Corretor/Arquiteto/Engenheiro)
- Registro profissional (CRECI/CAU/CREA com UF)
- Localizacao (UF, Cidade, Bairro)
- Status (Ativo/Inativo com switch)
- Data de cadastro
