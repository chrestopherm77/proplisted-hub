## Sistema de Feedback de Leads (14 dias)

Envia mensagem automática via Mega API para o lead que segue ativo há 14 dias, perguntando se já concretizou o negócio (comprar/alugar/vender/construir). A resposta do usuário inativa o lead ou mantém ativo.

### Fluxo

```text
Lead criado e ativo
        │
        ▼
14 dias ativo (sem feedback enviado)
        │
        ▼
Cron diário roda → seleciona leads elegíveis
        │
        ▼
Envia listMessage Mega API com 2 opções dinâmicas:
   - BUY   → "Já comprei"      / "Ainda não comprei"
   - RENT  → "Já aluguei"      / "Ainda não aluguei"
   - SELL  → "Já vendi"        / "Ainda não vendi"
   - BUILD → "Já contratei"    / "Ainda não contratei"
        │
        ▼
Marca feedback_sent_at = now()
        │
        ▼
Usuário responde no WhatsApp
        │
        ▼
mega-webhook recebe listResponseMessage
        │
        ├── rowId "feedback_done_<leadId>"     → is_active=false,
        │                                         feedback_response='DONE'
        │
        └── rowId "feedback_pending_<leadId>"  → mantém is_active=true,
                                                  feedback_response='PENDING'
                                                  (pode ser reagendado +14d)
```

### Mudanças no banco

Adicionar à tabela `leads`:
- `feedback_sent_at` (timestamptz, nullable) — quando o feedback foi enviado
- `feedback_response` (text, nullable) — 'DONE' ou 'PENDING'
- `feedback_responded_at` (timestamptz, nullable)
- `feedback_attempts` (integer, default 0) — para reenvio quando PENDING

### Nova Edge Function: `send-lead-feedback`

- Recebe `{ leadId }` (chamada manual via admin) **ou** roda em modo cron (sem body) buscando todos os leads elegíveis:
  - `is_active = true`
  - `whatsapp_confirmed = true`
  - `is_exhausted = false`
  - `created_at <= now() - interval '14 days'` (1ª vez) **ou** `feedback_response='PENDING' AND feedback_sent_at <= now() - interval '14 days'` (reenvio)
  - `feedback_response IS NULL OR feedback_response = 'PENDING'`
- Resolve intenção do `form_data.intention` (com fallback para arrays como já corrigido em `notify-lead-group`)
- Monta texto e botões dinâmicos pelas labels acima
- Chama `listMessage` da Mega API com `rowId` = `feedback_done_<leadId>` e `feedback_pending_<leadId>`
- Atualiza `feedback_sent_at`, incrementa `feedback_attempts`
- Respeita delay de 600ms entre chamadas (limite Mega API), conforme regra do projeto

### Atualização em `mega-webhook`

Estende o handler de `listResponseMessage` para reconhecer os novos `rowId`:
- `feedback_done_<leadId>` → `UPDATE leads SET is_active=false, feedback_response='DONE', feedback_responded_at=now()` + envia mensagem de agradecimento simples
- `feedback_pending_<leadId>` → `UPDATE leads SET feedback_response='PENDING', feedback_responded_at=now()` (lead segue ativo; será reavaliado em +14d pelo cron)
- Mantém o comportamento atual de `confirm_<leadId>` intacto

### Cron job (pg_cron + pg_net)

Job diário às 10:00 BRT chamando `send-lead-feedback` sem body, para varrer todos os elegíveis.

### Painel admin (opcional, leve)

Em `LeadsManagement.tsx`, adicionar:
- Badge mostrando estado do feedback (Enviado / Já fechou / Em aberto)
- Botão "Pedir feedback agora" que invoca `send-lead-feedback` com `{ leadId }` para disparo manual

### Arquivos afetados

- `supabase/functions/send-lead-feedback/index.ts` (novo)
- `supabase/functions/mega-webhook/index.ts` (estender switch de rowId)
- `supabase/config.toml` (registrar nova função com `verify_jwt = false` para o cron; validação por `CRON_SECRET` no body/header conforme padrão do projeto)
- Migração: 4 colunas em `leads`
- Insert SQL (não-migração): agendar `cron.schedule` apontando para a função
- `src/components/admin/LeadsManagement.tsx` (badge + botão manual — opcional)

### Confirmações antes de implementar

1. Janela de 14 dias conta a partir de `created_at` do lead, certo? (ou prefere `whatsapp_confirmed` data?)
2. Quando o usuário responde "Ainda não", quer reenviar a cada +14d indefinidamente, ou parar após N tentativas (ex.: 3)?
3. Posso incluir o ajuste no painel admin (badge + botão manual) nesta mesma entrega?