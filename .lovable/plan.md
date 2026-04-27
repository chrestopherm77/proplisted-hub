
# Trocar domínio: `leadbay.com.br` → `conectaeimob.com.br`

Mapeei todas as 72 ocorrências do domínio antigo no código. Vou trocar **tudo** para o novo domínio `conectaeimob.com.br` (com `www.conectaeimob.com.br` no fallback, mantendo o staging `proplisted-hub.lovable.app` por enquanto).

## O que vai mudar

### 1. CORS de todas as edge functions (24 arquivos)
A lista `ALLOWED_ORIGINS` em cada função passa a ser:
```ts
['https://conectaeimob.com.br', 'https://www.conectaeimob.com.br', 'https://proplisted-hub.lovable.app']
```
Funções afetadas: `admin-adjust-credits`, `check-credit-status`, `check-whatsapp`, `create-credit-purchase`, `create-news-post`, `create-payment`, `get-partial-lead`, `list-users`, `merge-or-create-lead`, `notify-new-lead`, `reconcile-asaas-payments`, `redeem-voucher`, `reset-password`, `send-email-code`, `send-financing-whatsapp`, `send-lead-confirmation`, `send-password-reset`, `send-promo-blast`, `send-whatsapp-code`, `validate-coupon`, `verify-email-code`, `verify-whatsapp-code`.

### 2. Redirects do Asaas (checkout)
- `supabase/functions/create-credit-purchase/index.ts` — `FRONTEND_URL = 'https://conectaeimob.com.br'` (usado em successUrl, errorUrl, expiredUrl, cancelUrl).
- `supabase/functions/create-payment/index.ts` — mesmo ajuste em `FRONTEND_URL`.

### 3. Links em e-mails e mensagens de WhatsApp
- `daily-news-broadcast` — link "Acesse agora" passa para `https://www.conectaeimob.com.br/giro-do-mercado`.
- `mega-webhook` (2 ocorrências) — link "👉 https://www.conectaeimob.com.br/leads".
- `notify-lead-group` — link "👉 https://www.conectaeimob.com.br/leads".
- `notify-property-match` — link "👉 https://www.conectaeimob.com.br/leads".
- `notify-group-new-search` — link "https://www.conectaeimob.com.br/property-searches".
- `recovery-abandoned-lead` — `https://conectaeimob.com.br${sourceLp}?resume=...`.
- `send-password-reset` — `resetLink = https://www.conectaeimob.com.br/reset-password?token=...`.
- `send-promo-blast` — botão CTA do e-mail aponta para `https://www.conectaeimob.com.br`.

### 4. Remetente dos e-mails (Resend)
Trocar `from: "Conectae <noreply@leadbay.com.br>"` por `from: "Conectae <noreply@conectaeimob.com.br>"` em:
- `notify-new-lead/index.ts`
- `send-email-code/index.ts`
- `send-password-reset/index.ts`
- `send-promo-blast/index.ts`

**Importante:** para e-mails serem entregues, o domínio `conectaeimob.com.br` precisa estar verificado no Resend (DKIM/SPF/DMARC). Se ainda não estiver, e-mails podem falhar até a verificação. Posso te avisar para verificar isso após o deploy.

### 5. Front-end
- `src/contexts/PartnerContext.tsx` — domínios "principais" passam para `conectaeimob.com.br` e `www.conectaeimob.com.br` (controla quando exibir branding Conectae vs. parceiro white-label).
- `src/pages/Launches.tsx` — texto do WhatsApp: "Vim do site da Conectae...".

### 6. Texto institucional
- `src/components/leadform/steps/ContactStep.tsx` — substituir "LEADBAY" por "CONECTAE" nas 6 menções dos termos exibidos no formulário.

### 7. User-Agent técnico (não visível ao usuário)
- `supabase/functions/geocode-properties/index.ts` — `User-Agent: 'Conectae/1.0 (contato@conectaeimob.com.br)'`.
- `ASAAS_INTEGRATION_GUIDE.md` — atualizar exemplo de `'LeadBay-System'` para `'Conectae-System'`.

## O que NÃO vai mudar (proposital)

- **`src/assets/leadbay-logo.png`** e o import `leadbayLogo` em `src/pages/Index.tsx` — é só o **nome do arquivo/variável** do logo de fallback. O logo visível já é o Conectae. Renomear o arquivo poderia quebrar referências históricas; deixo como está (sem impacto visual).
- **Staging Lovable** (`proplisted-hub.lovable.app`) — mantido em CORS para você poder testar.

## Pós-implementação (você precisa fazer fora do código)

1. **Asaas:** confirmar/atualizar a Webhook URL e quaisquer fallback URLs no painel do Asaas (sandbox e produção) para `https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/asaas-webhook` (essa não muda, mas vale checar) e qualquer URL de retorno cadastrada para `conectaeimob.com.br`.
2. **Resend:** verificar o domínio `conectaeimob.com.br` (DKIM/SPF/DMARC) antes de e-mails saírem com o novo remetente — caso contrário, posso reverter o `from` para o domínio antigo temporariamente.
3. **Lovable Custom Domain:** conectar `conectaeimob.com.br` e `www.conectaeimob.com.br` em **Project Settings → Domains** (caso ainda não esteja).

Quer que eu já execute tudo isso?
