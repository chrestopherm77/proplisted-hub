

## Mover recuperacao de senha para a pagina de Perfil

### Problema atual

O fluxo de recuperacao de senha usando a rota `/reset-password` nao esta funcionando de forma confiavel. A deteccao do evento `PASSWORD_RECOVERY` falha e o usuario ve "Link Expirado".

### Solucao

Simplificar o fluxo: o link do e-mail vai redirecionar direto para `/profile`, onde o usuario ja estara logado (o token de recovery cria uma sessao automaticamente). Na pagina de perfil, sera adicionada uma secao para alterar a senha.

### Alteracoes

| Arquivo | O que muda |
|---|---|
| `supabase/functions/send-password-reset/index.ts` | Trocar o `redirectTo` de `/reset-password` para `/profile` |
| `src/pages/Profile.tsx` | Adicionar uma secao "Alterar Senha" com campos de nova senha, confirmacao e botao de salvar. Usa `supabase.auth.updateUser({ password })` |
| `src/pages/ResetPassword.tsx` | Manter como fallback, mas redirecionar para `/profile` caso o usuario ja tenha sessao ativa |

### Detalhes tecnicos

**1. Edge Function** - Mudar a linha do `redirectTo`:
```text
Antes: redirectTo = baseUrl + "/reset-password"
Depois: redirectTo = baseUrl + "/profile"
```

**2. Pagina de Perfil** - Adicionar um segundo Card abaixo dos dados do perfil com:
- Campo "Nova Senha" (com toggle de visibilidade)
- Campo "Confirmar Nova Senha" (com toggle de visibilidade)
- Validacao de senha (minimo 6 caracteres, maiuscula, minuscula, numero)
- Botao "Alterar Senha"
- Usa `supabase.auth.updateUser({ password })` para salvar

**3. ResetPassword** - Redirecionar para `/profile` se ja houver sessao ativa, para nao deixar o usuario preso na tela de loading.

### Fluxo corrigido

```text
1. Usuario clica "Esqueci minha senha"
2. Recebe e-mail com link
3. Clica no link -> Supabase processa o token e cria sessao
4. Redirecionado para /profile (ja logado)
5. Ve a secao "Alterar Senha" na pagina de perfil
6. Define nova senha e salva
```

Esse fluxo e mais confiavel porque nao depende da deteccao do evento `PASSWORD_RECOVERY` - o usuario simplesmente chega logado na pagina de perfil e altera a senha.
