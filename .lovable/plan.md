

## Recuperacao de Carrinho Abandonado via WhatsApp

### O que sera feito

Quando um lead preencher nome e telefone mas nao finalizar o cadastro, o sistema envia automaticamente uma mensagem no WhatsApp 10 minutos depois, com texto personalizado (nome, objetivo) e um link para retomar o formulario de onde parou.

### Alteracoes

**1. Adicionar colunas na tabela `lp_partial_leads`** (migration)

- `recovery_sent_at` (timestamptz, nullable) — marca quando a mensagem de recuperacao foi enviada (evita duplicatas)
- `source_lp` (text, nullable) — identifica de qual LP veio (`/lp` ou `/lp-01`)

**2. Criar edge function `recovery-abandoned-lead`**

Funcao chamada periodicamente via cron (a cada 3 minutos). Ela:
- Busca leads parciais onde: `completed = false`, `recovery_sent_at IS NULL`, `phone IS NOT NULL`, e `updated_at < NOW() - 10 min`
- Para cada lead encontrado, traduz a `intention` (SELL→venda, BUY→compra, BUILD→construcao, RENT→aluguel)
- Monta o link de retomada: `https://leadbay.com{source_lp}?resume={session_id}` (usando a LP de origem)
- Envia mensagem via Mega API (POST sendMessage) com o texto personalizado
- Marca `recovery_sent_at = NOW()` no registro

Texto da mensagem:
```
Olá {nome}! Tudo bem? 😊

Vimos que você não finalizou o cadastro na LeadBay em relação a sua busca por *{objetivo}*.

Vou enviar nosso link de cadastro novamente para encontrarmos a melhor solução para você:

👉 {link}
```

**3. Salvar `source_lp` no LeadFormWizard**

- Adicionar prop `sourceLp` ao `LeadFormWizard` (default `/lp`)
- Passar `/lp` no `LeadForm.tsx` e `/lp-01` no `LeadForm01.tsx`
- Incluir `source_lp` no payload de insert/update do `lp_partial_leads`

**4. Retomada do formulario (resume)**

- No `LeadFormWizard`, ao montar, checar query param `?resume=SESSION_ID`
- Se presente, criar uma edge function `get-partial-lead` que busca o partial lead pelo session_id e retorna o `form_data`, `current_step`, `step_index`
- Preencher o `formData` com os dados salvos e posicionar no step correto
- Atualizar o `sessionIdRef` para o session_id recebido (para continuar rastreando no mesmo registro)

**5. Configurar cron job**

- Habilitar extensoes `pg_cron` e `pg_net` (migration)
- Criar job que chama a edge function `recovery-abandoned-lead` a cada 3 minutos

**6. Registrar no config.toml**

- `recovery-abandoned-lead` com `verify_jwt = false`
- `get-partial-lead` com `verify_jwt = false`

### Fluxo completo

```text
Lead preenche nome+telefone → partial lead salvo com source_lp
         ↓ (nao finaliza)
    10 min se passam
         ↓
  Cron dispara edge function
         ↓
  Busca leads incompletos > 10min
         ↓
  Envia WhatsApp via Mega API
         ↓
  Lead clica no link → /lp?resume=abc123
         ↓
  Wizard carrega dados salvos e posiciona no step correto
```

### Detalhes tecnicos

- A edge function `get-partial-lead` usa service role key para buscar no banco (partial leads nao tem SELECT publico)
- O cron roda a cada 3 minutos, mas so processa leads com `updated_at` mais velho que 10 minutos, garantindo que nao envia mensagem cedo demais
- Limite de seguranca: processar no maximo 50 leads por execucao do cron para evitar timeout

