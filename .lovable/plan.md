# Renomear LeadBay → Conectae

Vou trocar todas as ocorrências do nome **"LeadBay" / "Leadbay" / "LEADBAY"** para **"Conectae" / "CONECTAE"** em textos visíveis ao usuário (mensagens WhatsApp, e-mails, contratos, notificações, títulos, headers).

## O que NÃO será alterado (proposital)

Conforme suas respostas:
- **URLs** (`leadbay.com.br`, `www.leadbay.com.br`) — mantidas em CORS, links de WhatsApp/e-mail e geocoder. Você troca depois quando o DNS propagar.
- **Remetente de e-mail** (`noreply@leadbay.com.br`) — mantido até você ajustar o Resend.
- **`User-Agent`** das chamadas internas para Asaas/Nominatim — pode trocar mas não impacta usuário; vou trocar para `Conectae-...` por consistência (não afeta funcionalidade).
- **`assets/leadbay-logo.png`** — não renomeio o arquivo (já existe `conectae-logo.png` em uso). Apenas removo a importação não usada se for o caso.

## Mapa de alterações por arquivo

### Mensagens WhatsApp / textos visíveis
- `supabase/functions/daily-news-broadcast/index.ts` — "time Leadbay" → "time Conectae".
- `supabase/functions/recovery-abandoned-lead/index.ts` — "cadastro na LeadBay" → "cadastro na Conectae".
- `supabase/functions/send-lead-confirmation/index.ts` — `title: "LeadBay"` e descrição → "Conectae".
- `src/components/leadform/LeadFormWizard.tsx` — `User-Agent: 'LeadBay/1.0'` → `Conectae/1.0`.
- `src/pages/Launches.tsx` — texto "Vim do site da leadbay..." → "Vim do site da Conectae...".

### E-mails (HTML)
- `supabase/functions/notify-new-lead/index.ts` — header "🏠 LeadBay", rodapé "© LeadBay" e textos do corpo.
- `supabase/functions/send-email-code/index.ts` — header, subject "LeadBay - Código de Verificação", rodapé.
- `supabase/functions/send-password-reset/index.ts` — header, subject "LeadBay - Recuperação de Senha", rodapé.
- `supabase/functions/send-promo-blast/index.ts` — header, "Equipe comercial LeadBay", rodapé. (Botão CTA continua apontando para `https://www.leadbay.com.br`.)
- `supabase/functions/create-credit-purchase/index.ts` — descrição do pagamento "X créditos LeadBay" → "X créditos Conectae".
- `supabase/functions/create-subscription/index.ts` — "Assinatura {plan} - LeadBay" → "... - Conectae".

### Contratos legais (`src/components/auth/constants/registrationTerms.ts`)
Substituição global de **LEADBAY → CONECTAE** em todo o arquivo (Contrato de Parceria, DPA, Termos de Uso, Política de Privacidade), incluindo:
- "TERMO DE USO DA PLATAFORMA LEADBAY" → "... CONECTAE".
- Todas as 50+ menções jurídicas a "LEADBAY".

### User-Agent interno (não visível ao usuário, troco por consistência)
Em todas as edge functions: `LeadBay-Webhook`, `LeadBay-System`, `LeadBay-CreditCheck`, `LeadBay-Reconcile`, `LeadBay/1.0` → versões `Conectae-...`.

### Limpeza opcional
- `src/pages/Index.tsx` — variável `leadbayLogo` é fallback para o logo de parceiro. Renomeio para `defaultLogo` por clareza (sem mudar comportamento).

## Notas técnicas

- Nenhuma migração de banco necessária.
- Nenhuma alteração em RLS/políticas/secrets.
- E-mails continuam saindo de `noreply@leadbay.com.br` — funciona normalmente, só o conteúdo (header/rodapé/subject) passa a dizer "Conectae".
- Contratos: o arquivo é estático (TS const), então usuários novos verão "CONECTAE" imediatamente após o deploy. Usuários antigos aceitaram a versão "LEADBAY" — isso não é alterado historicamente.

## Próximos passos (depois desta troca)

Quando o domínio `conectae.com.br` estiver propagado, basta me avisar e eu faço uma segunda passada substituindo:
- URLs em CORS (`ALLOWED_ORIGINS`)
- Links em mensagens (`https://www.leadbay.com.br/...`)
- Remetente Resend (`from: "Conectae <noreply@conectae.com.br>"`)
- E-mail de contato no User-Agent do geocoder
