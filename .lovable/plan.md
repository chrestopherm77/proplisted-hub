

## Plano: Disparo de e-mail promocional para todos os corretores

### O que será feito

Criar uma edge function temporária `send-promo-blast` que:
1. Consulta todos os perfis ativos (`profiles` com `is_active = true` e `email` preenchido)
2. Envia o e-mail promocional via Resend (já configurado no projeto)
3. Respeita o rate limit do Resend (delay de 600ms entre envios)
4. Retorna relatório de quantos e-mails foram enviados com sucesso/falha

### Conteúdo do e-mail

HTML estilizado com a identidade visual do LeadBay contendo:
- Saudação "Olá Corretor!"
- Texto sobre liquidação de estoque
- Destaque: "Leads a partir de R$5,00"
- Validade: até 31/03/26
- CTA com link para leadbay.com.br
- Assinatura: Equipe comercial LeadBay

### Como disparar

Após o deploy, você invoca a function uma única vez via painel ou chamada direta. Ela processará todos os corretores automaticamente.

### Detalhes técnicos

- **Nova edge function**: `supabase/functions/send-promo-blast/index.ts`
- **Config**: `verify_jwt = false` (disparo manual único)
- **Usa**: Resend SDK com `RESEND_API_KEY` já configurada
- **Query**: `SELECT id, name, email FROM profiles WHERE is_active = true AND email IS NOT NULL`
- **Rate limit**: 600ms delay entre cada envio
- **From**: `LeadBay <noreply@leadbay.com.br>`

