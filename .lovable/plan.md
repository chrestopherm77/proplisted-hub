
## Disparo diário de notícias nos grupos do WhatsApp (07:00)

### O que vai acontecer
Todo dia às **07:00 (horário de Brasília)** será enviada automaticamente uma mensagem nos 3 grupos do WhatsApp com uma chamada para o "Giro do Mercado".

### Mensagem (copy)
```
☀️ *Bom dia, time Leadbay!*

📰 *Giro do Mercado Imobiliário*

Confira as notícias que estão movimentando o mercado imobiliário hoje e saia na frente da concorrência:

✅ Tendências de preços
✅ Novidades em financiamento
✅ Lançamentos e oportunidades
✅ Mudanças regulatórias

Informação é a base de toda boa negociação. 💼

👉 Acesse agora: https://www.leadbay.com.br/giro-do-mercado

Bons negócios! 🚀
```

### Implementação técnica

**1. Nova edge function `daily-news-broadcast`** (`supabase/functions/daily-news-broadcast/index.ts`)
- Valida header `Authorization: Bearer ${CRON_SECRET}` (segurança)
- Loop nos 3 grupos do WhatsApp (`120363407964054463`, `120363426047592689`, `120363410244397205`)
- Para cada grupo: 3 tentativas com backoff (mesmo padrão de `mega-webhook`)
- Delay de 700ms entre grupos
- Retorna JSON com status de cada grupo

**2. Cron job no Postgres (pg_cron + pg_net)**
- Agendado para `0 10 * * *` UTC = **07:00 horário de Brasília** (UTC-3)
- Faz `net.http_post` para a edge function passando `CRON_SECRET` no header
- Será criado via SQL insert (não migration, pois contém dados específicos do projeto)

### Arquivos
- **Novo:** `supabase/functions/daily-news-broadcast/index.ts`
- **SQL via insert:** registrar cron job `daily-news-broadcast-7am`

### Observações
- Reuso do secret `CRON_SECRET` que já existe — sem necessidade de adicionar novos.
- Reuso do secret `MEGA_API_TOKEN` que já está configurado.
- IDs dos grupos hardcoded na função (consistente com as outras 3 funções de broadcast).
- Se quiser pausar no futuro, basta `SELECT cron.unschedule('daily-news-broadcast-7am')`.
