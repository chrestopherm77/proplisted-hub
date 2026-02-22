

## Corrigir fluxo de recuperacao de senha

### Problema

O link de recuperacao de senha no e-mail esta redirecionando para `https://leadbay.com.br/reset-password`, que nao e o dominio correto da aplicacao. Por isso, o usuario nao consegue acessar a pagina para criar uma nova senha.

### O que sera feito

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/send-password-reset/index.ts` | Receber a URL de origem do frontend e usar como base para o `redirectTo`, em vez do dominio fixo `leadbay.com.br` |
| `src/components/auth/ForgotPasswordModal.tsx` | Enviar `window.location.origin` junto com o e-mail para que o backend saiba para onde redirecionar |
| `src/pages/ResetPassword.tsx` | Melhorar o tratamento da sessao de recovery -- detectar o token na URL e estabelecer a sessao antes de permitir a troca de senha |

### Detalhes tecnicos

**1. Edge Function (`send-password-reset`)**

Atualmente o `redirectTo` esta fixo em `https://leadbay.com.br/reset-password`. Sera alterado para usar a URL enviada pelo frontend:

```text
Frontend envia: { email, redirectUrl: "https://proplisted-hub.lovable.app" }
Edge Function usa: redirectTo = redirectUrl + "/reset-password"
```

**2. Frontend - ForgotPasswordModal**

Adicionar `redirectUrl: window.location.origin` no body da requisicao para que o link no e-mail aponte para o dominio correto.

**3. ResetPassword page**

Adicionar logica para detectar o evento `PASSWORD_RECOVERY` do Supabase Auth via `onAuthStateChange`. Quando o usuario clica no link do e-mail, o Supabase automaticamente cria uma sessao de recovery. A pagina vai:
- Escutar o evento `PASSWORD_RECOVERY`
- Mostrar o formulario de nova senha quando a sessao estiver ativa
- Mostrar mensagem de link invalido/expirado se nao houver sessao apos alguns segundos

### Fluxo corrigido

```text
1. Usuario clica "Esqueci minha senha"
2. Digita o e-mail e envia
3. Edge Function gera link com redirectTo apontando para o dominio correto
4. Usuario recebe e-mail com botao "Redefinir Senha"
5. Clica no link -> abre /reset-password no dominio correto
6. Supabase processa o token e cria sessao de recovery
7. Pagina detecta a sessao e mostra formulario de nova senha
8. Usuario define nova senha -> redirecionado para /auth
```

