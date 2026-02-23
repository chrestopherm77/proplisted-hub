

## Modal de redefinicao de senha no Perfil (apenas via link de recuperacao)

### Como vai funcionar

Quando o usuario clicar no link de recuperacao de senha no e-mail, ele sera redirecionado para `/profile`. A URL tera um parametro especial (`?recovery=true`) que indica que o usuario veio do fluxo de recuperacao. Um modal abrira automaticamente pedindo a nova senha. Se o usuario acessar `/profile` normalmente, o modal nao aparece.

### Alteracoes

| Arquivo | O que muda |
|---|---|
| `supabase/functions/send-password-reset/index.ts` | Mudar o `redirectTo` de `/profile` para `/profile?recovery=true` |
| `src/components/profile/PasswordRecoveryModal.tsx` | **Novo arquivo** - Modal com campos de nova senha e confirmacao, validacao e chamada a `supabase.auth.updateUser` |
| `src/pages/Profile.tsx` | Detectar `?recovery=true` na URL e abrir o modal automaticamente. Remover a secao fixa de "Alterar Senha" do card (a funcionalidade ficara no modal) |
| `src/pages/ResetPassword.tsx` | Redirecionar para `/profile?recovery=true` em vez de `/profile` |

### Detalhes tecnicos

**1. Edge Function** - Adicionar `?recovery=true` ao redirect:
```text
Antes: redirectTo = baseUrl + "/profile"
Depois: redirectTo = baseUrl + "/profile?recovery=true"
```

**2. Novo componente PasswordRecoveryModal**
- Recebe props `isOpen` e `onClose`
- Campos: Nova Senha e Confirmar Senha (com toggle de visibilidade)
- Validacao usando `validatePassword` existente
- Ao salvar: chama `supabase.auth.updateUser({ password })`
- Apos sucesso: exibe mensagem de confirmacao, limpa o parametro `?recovery=true` da URL e fecha o modal

**3. Profile.tsx**
- Ao montar, verifica `searchParams.get("recovery")` 
- Se `recovery=true`, abre o `PasswordRecoveryModal`
- A secao "Alterar Senha" que ja existe no card permanece para uso normal, e o modal e apenas o gatilho automatico quando vindo do link de recuperacao
- Ao fechar o modal, remove o parametro `recovery` da URL para evitar reaberturas

**4. ResetPassword.tsx**
- Muda o redirect de `/profile` para `/profile?recovery=true`

### Fluxo completo

```text
1. Usuario clica "Esqueci minha senha" no login
2. Recebe e-mail com link de recuperacao
3. Clica no link -> Supabase processa token e cria sessao
4. Redirecionado para /profile?recovery=true (ja logado)
5. Modal abre automaticamente pedindo nova senha
6. Usuario define nova senha e confirma
7. Senha atualizada -> modal fecha -> usuario fica no perfil
```

Se o usuario acessar `/profile` diretamente (sem `?recovery=true`), ve a pagina de perfil normal com a secao de alterar senha no card, sem modal.

