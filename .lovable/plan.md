

## Causa raiz: webhook do Asaas bloqueado por token errado

### O que aconteceu com o pagamento do Renê

1. **16:05:26** — Renê iniciou compra de 700 créditos via PIX (`credits_bb3cb0c9-2d1a-4591-a2e5-adc85257e128`). Status ficou `PENDING`.
2. Renê pagou no Asaas com sucesso. O Asaas começou a enviar webhooks de confirmação.
3. **Todas as tentativas do Asaas foram rejeitadas pelo nosso webhook com 401 Unauthorized.** Por isso aparece "Penalização aplicada" na fila do Asaas.
4. Como o webhook nunca foi processado, a função `processCreditPaymentConfirmation` nunca rodou → `credit_purchases.status` ficou `PENDING` → créditos não foram somados ao saldo.

### Por que está dando 401

O Asaas está enviando o header `asaas-access-token` com o valor:
```
meu_webhook_secret_producao_2024_seguro
```

Mas o secret `ASAAS_WEBHOOK_SECRET` configurado no nosso backend tem outro valor. O webhook compara os dois com:
```ts
if (incomingToken !== ASAAS_WEBHOOK_SECRET) { return 401 }
```

Como os valores não batem, **toda** notificação do Asaas é rejeitada — não só a do Renê. Qualquer outro pagamento que dependa do webhook (compra de leads, expiração, etc.) também está sendo perdido silenciosamente neste momento.

Confirmações das evidências:
- 10 tentativas registradas em `asaas_webhook_events` entre 16:05 e 16:41, todas com `event_type = UNAUTHORIZED_ATTEMPT`.
- Todas vêm do User-Agent `Asaas_Prod/3.0` e do IP de produção do Asaas (`54.94.183.101`).
- O token enviado em todas é literalmente `meu_webhook_secret_producao_2024_seguro` (parece um placeholder de exemplo configurado lá no Asaas).

### Plano de correção

**1. Alinhar o token do webhook (ação fora do código — só você pode fazer)**

Você precisa fazer **uma** das duas opções:

- **Opção A (recomendada)**: No painel do Asaas, em **Integrações → Webhooks**, editar o webhook que aponta para `https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/asaas-webhook` e trocar o campo "Token de autenticação" para o valor real que está no nosso secret `ASAAS_WEBHOOK_SECRET`.
- **Opção B**: Atualizar o secret `ASAAS_WEBHOOK_SECRET` no Lovable Cloud para o valor `meu_webhook_secret_producao_2024_seguro` (não recomendo — esse valor parece exemplo público).

Após isso, **destravar o webhook no Asaas** (a "Penalização aplicada" precisa ser removida manualmente no painel do Asaas para ele voltar a tentar).

**2. Reprocessar a compra do Renê (eu faço via migração)**

Como você já adicionou os 580 créditos manualmente, vou apenas marcar a compra `57788af3-5d95-406b-ac0c-fe71096d5f57` como `PAID` com `confirmed_at = now()` e registrar uma `credit_transactions` de auditoria do tipo `CREDIT_PURCHASE_MANUAL_RECONCILE` para o histórico ficar consistente. Sem somar créditos de novo (você já adicionou).

**3. Hardening da edge function `asaas-webhook` (eu faço no código)**

Para evitar que isso volte a acontecer silenciosamente:

- **Notificar admin quando bloquearmos webhook por token inválido**: hoje só gravamos em `asaas_webhook_events`. Vou adicionar log mais explícito + um contador. Se em 10 minutos houver mais de 3 `UNAUTHORIZED_ATTEMPT`, registrar em uma tabela `admin_alerts` (criar via migração) para aparecer no painel admin.
- **Marcar compra como `FAILED_WEBHOOK` quando expirar sem confirmação**: criar uma cron de varredura diária que olha `credit_purchases` em `PENDING` há mais de 2h e:
  - Consulta o status real direto na API do Asaas (`GET /payments/{externalReference}`).
  - Se estiver pago lá e pendente aqui → reprocessa via `processCreditPaymentConfirmation` (idempotente, já trata `status = 'PAID'`).
  - Se estiver expirado/cancelado lá → marca como `EXPIRED`/`CANCELLED` aqui.
  
  Mesma lógica para `purchases` (compras de leads).

**4. Painel admin: aba "Pagamentos pendentes" (eu faço no código)**

Pequena tela em `Admin.tsx` mostrando:
- `credit_purchases` e `purchases` em `PENDING` há mais de 30 minutos.
- Botão "Reverificar no Asaas" que dispara a edge function de reconciliação manualmente para um ID específico.

### Detalhes técnicos

- Migração nova: criar `admin_alerts (id, type, message, severity, payload, created_at, read_at)` com RLS só para `MASTER_ADMIN`.
- Nova edge function: `reconcile-asaas-payments` (chamada por cron + manualmente pelo admin). Usa `CRON_SECRET` para chamadas agendadas e JWT + `has_role('MASTER_ADMIN')` para chamadas manuais.
- Cron diária registrada em `supabase/config.toml` rodando a cada 30 min.
- Tela admin reaproveita `AdjustCreditsDialog` como base de UI.

### Resultado

- Webhook do Asaas volta a funcionar assim que você alinhar o token.
- Compra do Renê fica registrada como paga no histórico (sem duplicar crédito).
- Sistema passa a detectar e alertar quando o webhook estiver caindo em 401.
- Sistema reconcilia automaticamente pagamentos pagos no Asaas mas pendentes aqui — protege contra qualquer falha futura de webhook (rede, downtime, token errado).

