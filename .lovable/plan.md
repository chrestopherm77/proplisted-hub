

# Plano: Corrigir Edge Function de Financiamento

## Problema
A API da Mega retornou erro 502 (servidor temporariamente fora). Além disso, há problemas de configuração na edge function.

## Correções

### 1. `supabase/config.toml`
Adicionar entrada para a função com `verify_jwt = false` (permite chamada sem JWT, como as demais funções de envio).

### 2. `supabase/functions/send-financing-whatsapp/index.ts`
- Corrigir CORS: usar origens restritas (`leadbay.com.br` e `proplisted-hub.lovable.app`) em vez de `*`
- Melhorar mensagem de erro: informar ao frontend quando é erro temporário da API externa
- Adicionar retry simples (1 tentativa extra) para erros 5xx da Mega API

### 3. `src/pages/Financing.tsx`
- Melhorar mensagem de erro para o usuário: "Serviço temporariamente indisponível. Tente novamente em alguns minutos."

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/config.toml` | Adicionar `[functions.send-financing-whatsapp]` |
| `supabase/functions/send-financing-whatsapp/index.ts` | CORS restrito, retry, melhor erro |
| `src/pages/Financing.tsx` | Mensagem de erro mais clara |

