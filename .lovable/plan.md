

## Diagnóstico: Emails não enviados para todos os usuários

### Problema identificado

A função `notify-new-lead` usa `supabase.auth.admin.listUsers()` para buscar os emails dos usuários. Essa chamada é **paginada** e pode não retornar todos os usuários de forma confiável. Além disso, ela busca TODOS os usuários do auth e depois filtra — abordagem ineficiente e frágil.

Na imagem do Resend, o último lead (17h atrás) foi enviado para apenas 3 dos 6 perfis cadastrados em Ribeirão Preto:
- ✅ c.perussi@hotmail.com
- ✅ icomprassuporte@gmail.com  
- ✅ lucasphilbr@gmail.com
- ❌ Gustavo Merszi (não recebeu)
- ❌ João Vitor (não recebeu)
- ❌ Gustavo Beltrami (não recebeu)

### Solução

**1. Adicionar coluna `email` na tabela `profiles`** (migração)
- Criar coluna `email TEXT` na tabela profiles
- Atualizar o trigger `handle_new_user` para salvar `NEW.email` no perfil
- Popular os emails existentes a partir do `auth.users`

**2. Atualizar a edge function `notify-new-lead`**
- Remover a chamada `supabase.auth.admin.listUsers()` (fonte do bug)
- Buscar emails diretamente da tabela `profiles` com `select("id, address_city, email")`
- Filtrar por cidade E email não nulo
- Isso elimina a dependência da API paginada do auth admin

### Resultado
Todos os usuários cadastrados na mesma cidade receberão o email, sem depender de paginação do auth admin. Mais rápido e confiável.

### Arquivos alterados
- Migração SQL: adicionar coluna email + atualizar trigger
- `supabase/functions/notify-new-lead/index.ts`: simplificar busca de emails

