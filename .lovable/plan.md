

## Diagnóstico: Resend retorna sucesso mas não envia todos os emails

### Problema real

Os logs da edge function mostram "6 sent, 0 failed" — mas o Resend só registra 2 emails. O problema está no código: a SDK do Resend v2 **não lança exceção em caso de erro**. Ela retorna `{ data, error }`. O código atual ignora esse retorno, então registra "Email sent" mesmo quando o Resend rejeita o envio.

```text
Código atual (bugado):
  await resend.emails.send({...})  ← retorno ignorado
  console.log("Email sent")       ← sempre executa

Código correto:
  const { data, error } = await resend.emails.send({...})
  if (error) → log do erro real
  else → "Email sent"
```

### Solução

**Atualizar `supabase/functions/notify-new-lead/index.ts`** (linhas 867-880):

1. Capturar o retorno `{ data, error }` de cada `resend.emails.send()`
2. Verificar se `error` existe e logar o motivo real da rejeição
3. Adicionar um delay de 200ms entre envios para evitar rate limiting do Resend
4. Logar o ID do email retornado pelo Resend para rastreabilidade

Com isso, vamos descobrir o motivo exato pelo qual 4 emails estão sendo rejeitados (pode ser rate limit, domínio não verificado, etc.) e corrigir de acordo.

### Arquivo alterado
- `supabase/functions/notify-new-lead/index.ts`: corrigir tratamento de retorno do Resend + delay entre envios

