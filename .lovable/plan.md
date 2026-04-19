

## Problema

O cron das 7h (10:00 UTC) do `daily-news-broadcast` rodou ontem (18/04) e hoje (19/04) com `status: succeeded` no `pg_cron` — **mas a chamada HTTP retornou 401 Unauthorized**, então a função abortou antes de mandar a mensagem nos grupos.

### Causa raiz
O job está montando o Authorization a partir do **Vault**:
```sql
'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
```
Mas a `vault.secrets` está **vazia** (`SELECT name FROM vault.secrets` retorna 0 linhas). O `CRON_SECRET` existe como secret de Edge Function, **não no Vault do Postgres**. Resultado: a subquery retorna `NULL`, o header vira literalmente `"Bearer "` (sem token), a função recebe e responde 401.

Confirmado pelos logs do `net._http_response`: **toda chamada** ao `daily-news-broadcast` está vindo com `{"error":"Unauthorized"}` (inclusive a das 10:00 UTC de hoje).

Detalhe extra: existe outro chamador anônimo batendo na função a cada 10 min (origem ainda a investigar — pode ser um job antigo num outro lugar ou monitoramento), também levando 401. Isso não impede o conserto, mas vou checar.

## Correção

### 1. Recriar o cron job sem depender do Vault
Recriar `daily-news-broadcast-7am` colocando o `CRON_SECRET` **embutido literal** no comando (mesmo padrão dos outros 2 jobs que usam o anon key embutido e funcionam).

```sql
SELECT cron.unschedule('daily-news-broadcast-7am');
SELECT cron.schedule(
  'daily-news-broadcast-7am',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/daily-news-broadcast',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <CRON_SECRET>"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);
```

Como `CRON_SECRET` é dado sensível específico do projeto, vou rodar isso pela ferramenta de **insert SQL** (não migration), seguindo a regra do sistema sobre cron jobs.

### 2. Investigar o chamador a cada 10 min
Olhar se há outro scheduler (UptimeRobot, GitHub Actions, etc.) batendo nessa URL. Se for ruído externo, sem ação. Se for outro cron órfão, removo.

### 3. Disparo manual hoje
Depois de corrigir o job, **disparar a função manualmente uma vez** pra mandar o "Bom dia" do dia de hoje (já que perdeu o horário).

## Arquivo
- Cron job no Postgres (via insert SQL) — sem mudanças de código no repo.
- Sem alteração em `supabase/functions/daily-news-broadcast/index.ts` (a função está correta).

