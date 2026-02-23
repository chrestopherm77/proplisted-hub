

## Nova logica de recuperacao de senha (sem depender do redirect do Supabase)

### Problema raiz

O Supabase redireciona para o "Site URL" do projeto (`proplisted-hub.lovable.app`) ao processar o token de recuperacao. Mesmo configurando `redirectTo` para `leadbay.com.br`, o Supabase ignora se o dominio nao esta na lista de URLs permitidas ou se o Site URL esta diferente. Resultado: o usuario cai em `proplisted-hub.lovable.app/#error=...` em vez de ir para `leadbay.com.br`.

### Solucao: fluxo 100% customizado

Abandonar completamente o fluxo de recovery nativo do Supabase. Em vez disso, vamos gerar nosso proprio token, salvar no banco e enviar por e-mail. O usuario clica no link, vai para uma pagina dedicada em `leadbay.com.br`, digita o e-mail + nova senha, e uma edge function valida o token e atualiza a senha via admin API.

### Alteracoes

| Arquivo | O que muda |
|---|---|
| **Nova tabela** `password_reset_tokens` | Armazena tokens de recuperacao (email, token, expires_at, used) |
| `supabase/functions/send-password-reset/index.ts` | Gera um token UUID customizado, salva na tabela, envia e-mail com link para `https://www.leadbay.com.br/reset-password?token=xxx` |
| **Nova edge function** `reset-password/index.ts` | Recebe token + nova senha, valida o token no banco, atualiza a senha via `admin.updateUserById` |
| `src/pages/ResetPassword.tsx` | Reescrever completamente: le o token da URL, mostra formulario com e-mail + nova senha + confirmacao, chama a edge function `reset-password` |
| `supabase/config.toml` | Adicionar config da nova edge function `reset-password` com `verify_jwt = false` |

### Detalhes tecnicos

**1. Nova tabela `password_reset_tokens`**
- Colunas: `id` (uuid PK), `email` (text), `token` (text unique), `expires_at` (timestamptz), `used` (boolean default false), `created_at` (timestamptz)
- RLS habilitado, sem policies publicas (somente edge functions com service role acessam)

**2. Edge Function `send-password-reset` (atualizada)**
- Gera um UUID como token
- Salva na tabela `password_reset_tokens` com expiracao de 1 hora
- Monta o link: `https://www.leadbay.com.br/reset-password?token=UUID`
- Envia e-mail via Resend com esse link (sem usar `generateLink` do Supabase)

**3. Nova Edge Function `reset-password`**
- Recebe: `{ token, email, newPassword }`
- Busca o token na tabela: valida se existe, nao foi usado e nao expirou
- Busca o usuario pelo e-mail via `admin.listUsers`
- Atualiza a senha via `admin.updateUserById`
- Marca o token como usado
- Retorna sucesso ou erro

**4. Pagina `ResetPassword.tsx` (reescrita)**
- Le o `token` dos query params da URL
- Se nao tem token: mostra mensagem de erro com botao para voltar ao login
- Se tem token: mostra formulario com campos de e-mail, nova senha e confirmacao
- Ao submeter: chama `supabase.functions.invoke("reset-password", { body: { token, email, newPassword } })`
- Se sucesso: mostra tela de confirmacao com botao para ir ao login
- Se erro (token expirado/invalido): mostra mensagem adequada

### Fluxo completo

```text
1. Usuario clica "Esqueci minha senha" no login
2. ForgotPasswordModal envia e-mail para edge function send-password-reset
3. Edge function gera token, salva no banco, envia e-mail com link
4. Link no e-mail: https://www.leadbay.com.br/reset-password?token=abc123
5. Usuario clica -> abre pagina /reset-password no leadbay.com.br
6. Digita e-mail + nova senha + confirmacao
7. Frontend chama edge function reset-password
8. Edge function valida token, atualiza senha, marca token como usado
9. Usuario ve tela de sucesso e vai para o login
```

### Por que isso resolve

- Nao depende do redirect nativo do Supabase (que sempre vai para proplisted-hub.lovable.app)
- O link no e-mail aponta diretamente para `leadbay.com.br` -- sem intermediarios
- O token e validado pela nossa edge function, nao pelo fluxo de recovery do Supabase
- Funciona independente das configuracoes de Site URL ou Redirect URLs do Supabase

