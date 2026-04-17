
## Investigação: "Failed to fetch" no login

### Diagnóstico

O erro **"Failed to fetch"** com status `0` no login é um problema **conhecido do ambiente de preview do Lovable**, não do código.

**Causa raiz** (documentada): O ambiente de preview do Lovable injeta um proxy de `fetch` que intercepta requisições de rede. Esse proxy quebra especificamente as chamadas `POST` de autenticação do Supabase para `/auth/v1/token`. Requisições `GET` continuam funcionando, por isso o resto da plataforma parece OK, mas o login falha com `TypeError: Failed to fetch`.

### Evidências que suportam o diagnóstico

1. **Logs de auth do Supabase** (últimos eventos): logins recentes em `https://proplisted-hub.lovable.app` retornando `200` com sucesso. Ou seja, no domínio publicado o login funciona.
2. **Código de login** (`src/pages/Auth.tsx`): usa `supabase.auth.signInWithPassword` da forma padrão e correta — não há bug no client.
3. **Cliente Supabase** (`src/integrations/supabase/client.ts`): configuração padrão, `persistSession: true`, `autoRefreshToken: true`. Sem problemas.
4. **Sem erros nos logs do servidor**: o Supabase não está rejeitando — as requisições nem chegam até ele quando o erro ocorre no preview.

### Conclusão

O código de login está correto. O erro **"Failed to fetch"** ocorre apenas quando o usuário tenta logar pelo **iframe de preview do Lovable** (URLs `*.lovable.app/projects/...` ou o iframe embutido no editor). Em produção (`proplisted-hub.lovable.app` ou domínio próprio), o login funciona normalmente.

### O que fazer

**Não há mudança de código a fazer** — mexer em CORS, configuração do Supabase ou sobrescrever `window.fetch` não resolve e pode quebrar outras coisas.

**Orientação aos usuários que reportaram o erro:**
- Confirmar que estão acessando a **URL publicada** (`https://proplisted-hub.lovable.app`) e não o link de preview do editor.
- Se estiverem na URL correta e ainda assim derem erro, pedir:
  - Print da tela com a aba de Network do navegador aberta (mostrar a requisição falhada)
  - Navegador e versão
  - Se está em rede corporativa / VPN (firewalls podem bloquear `*.supabase.co`)
  - Se há extensão de bloqueio (uBlock, Privacy Badger, etc.) — algumas bloqueiam Supabase

### Melhoria opcional (posso implementar se aprovar)

Adicionar tratamento específico para `TypeError: Failed to fetch` em `src/pages/Auth.tsx` para mostrar uma mensagem mais clara ao usuário, em vez do genérico:

```ts
catch (error: any) {
  const isNetworkError = error?.message?.includes('Failed to fetch');
  toast({
    title: isNetworkError ? 'Erro de conexão' : 'Erro no login',
    description: isNetworkError
      ? 'Não foi possível conectar ao servidor. Verifique sua conexão, desative bloqueadores de anúncios/VPN e tente novamente.'
      : (error.message || 'Credenciais inválidas'),
    variant: 'destructive',
  });
}
```

### Arquivos (se aprovar a melhoria)
- editar `src/pages/Auth.tsx` — só o bloco `catch` do `handleLogin`
