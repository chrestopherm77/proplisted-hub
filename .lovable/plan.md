
## Corrigir dominio de recuperacao de senha

### Problema

O frontend envia `window.location.origin` como `redirectUrl`, que no ambiente Lovable e `https://proplisted-hub.lovable.app`. Mas o site real esta em `https://www.leadbay.com.br`. Por isso o link no e-mail aponta para o dominio errado.

### Solucao

Fixar o dominio de producao (`https://www.leadbay.com.br`) diretamente na Edge Function, ignorando o `redirectUrl` do frontend. O modal de recuperacao de senha ja existe no perfil e continuara funcionando.

### Alteracoes

| Arquivo | O que muda |
|---|---|
| `supabase/functions/send-password-reset/index.ts` | Fixar o `redirectTo` para `https://www.leadbay.com.br/profile?recovery=true`, ignorando o `redirectUrl` enviado pelo frontend |
| `src/components/auth/ForgotPasswordModal.tsx` | Remover o envio de `redirectUrl` (nao e mais necessario) |

### Detalhes tecnicos

**Edge Function** - Linha 35-36 muda de:
```text
const baseUrl = redirectUrl || "https://leadbay.com.br";
const resetRedirectUrl = `${baseUrl}/profile?recovery=true`;
```
Para:
```text
const resetRedirectUrl = "https://www.leadbay.com.br/profile?recovery=true";
```

**ForgotPasswordModal** - Linha 39 muda de:
```text
body: { email, redirectUrl: window.location.origin }
```
Para:
```text
body: { email }
```

### Fluxo

```text
1. Usuario clica "Esqueci minha senha"
2. Edge Function gera link com redirect para https://www.leadbay.com.br/profile?recovery=true
3. Usuario clica no link do e-mail
4. Supabase processa token, cria sessao, redireciona para o perfil
5. Pagina de perfil detecta ?recovery=true e abre o modal
6. Usuario define nova senha
```
