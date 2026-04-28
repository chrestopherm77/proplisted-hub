## Problema

Na tela `/reset-password`, ao enviar o formulário com e-mail + nova senha, está sendo exibido o toast "Erro ao redefinir senha".

## Diagnóstico

Investigando o fluxo:

1. **Token criado com sucesso** — `password_reset_tokens` tem o registro de `beltramicapital@gmail.com` (criado às 11:56, válido por 1h, ainda não usado).
2. **Edge function `reset-password` não está sendo executada** — não há nenhum log de invocação recente (nem sucesso, nem erro). Isso significa que a chamada `supabase.functions.invoke("reset-password", ...)` está falhando antes mesmo de atingir a função.
3. **Causa raiz: CORS bloqueando a origem do preview Lovable.**

A função `supabase/functions/reset-password/index.ts` tem `ALLOWED_ORIGINS` fixo:
```ts
const ALLOWED_ORIGINS = [
  'https://conectaeimob.com.br',
  'https://www.conectaeimob.com.br',
  'https://proplisted-hub.lovable.app',
];
```

Mas o usuário está testando a partir de `https://id-preview--cb8760c6-...lovable.app` (preview do Lovable), que NÃO está na lista. O preflight OPTIONS recebe `Access-Control-Allow-Origin` com a origem padrão (`conectaeimob.com.br`), o navegador rejeita, a chamada falha sem chegar à função, e o frontend mostra "Erro ao redefinir senha".

Mesmo problema potencial em produção se o usuário acessar via custom domain de white label de um parceiro (subdomínios diferentes).

Adicionalmente, no frontend (`src/pages/ResetPassword.tsx` linhas 58-66): qualquer falha de rede cai no `toast.error("Erro ao redefinir senha")` genérico, sem detalhar a causa real (ex: "Failed to fetch" / CORS).

## Plano de Correção

### 1. Edge function `supabase/functions/reset-password/index.ts`
- Substituir a lista fixa `ALLOWED_ORIGINS` por uma checagem que aceite:
  - Os domínios principais (`conectaeimob.com.br`, `www.conectaeimob.com.br`)
  - Qualquer subdomínio `*.lovable.app` (preview e published do Lovable)
  - Os domínios de white label cadastrados em `partners` (campo `custom_domain`, se aplicável) — opcionalmente liberar via regex segura.
- Garantir que `Access-Control-Allow-Methods: POST, OPTIONS` esteja no header.
- Adicionar `console.log` no início do handler para confirmar invocação em produção.
- Redeploy da função.

### 2. Mesma correção em `supabase/functions/send-password-reset/index.ts`
- Tem exatamente o mesmo padrão `ALLOWED_ORIGINS`. Aplicar o mesmo helper de CORS para evitar o mesmo problema na hora de SOLICITAR o reset.

### 3. Frontend `src/pages/ResetPassword.tsx`
- Logar `error` completo no console para diagnóstico futuro.
- Quando `error?.message` indicar falha de rede ("Failed to fetch"), exibir mensagem mais clara: "Não foi possível conectar ao servidor. Tente novamente."
- Manter o restante do fluxo (já trata `data?.error` corretamente).

## Detalhes Técnicos

CORS dinâmico sugerido (em ambas as funções):
```ts
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowed =
    /^https:\/\/([a-z0-9-]+\.)*conectaeimob\.com\.br$/i.test(origin) ||
    /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i.test(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://www.conectaeimob.com.br',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
```

Isso mantém o nível de segurança (só aceita domínios próprios + Lovable), mas libera previews e published do Lovable, resolvendo o erro reportado.

## Resultado Esperado

- O usuário consegue concluir o reset de senha tanto no domínio de produção quanto no preview Lovable.
- Em caso de erro real, mensagem mais clara aparece ao invés do genérico "Erro ao redefinir senha".
