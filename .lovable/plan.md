

# Plano: Corrigir número WhatsApp na Edge Function de Financiamento

## Problema

O número de destino na edge function `send-financing-whatsapp` está hardcoded como `5531991914663` (13 dígitos, com o 9 extra do celular). A Mega API pode exigir o formato sem o nono dígito para funcionar corretamente: `553191914663`.

As outras edge functions do projeto usam formato dinâmico onde o telefone vem do banco, mas esta usa número fixo.

## Correção

Alterar o número em `supabase/functions/send-financing-whatsapp/index.ts` linha 73:

**De:** `"5531991914663@s.whatsapp.net"`
**Para:** `"553191914663@s.whatsapp.net"`

Após a alteração, fazer deploy e testar a entrega da mensagem.

## Arquivo afetado

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/send-financing-whatsapp/index.ts` | Corrigir número de destino |

