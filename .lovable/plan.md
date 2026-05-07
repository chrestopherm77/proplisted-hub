## Objetivo

Criar no painel Admin uma nova aba **Email Marketing** que permita:
- Compor assunto, texto (rich/HTML) e imagem do email
- Escolher destinatários: todos os usuários cadastrados, seleção individual via lista, ou emails manuais
- Disparar via Resend com delay configurável entre **15 e 20 segundos** entre cada envio
- Acompanhar progresso e relatório (enviados / falhados)

## Mudanças

### 1. Nova edge function `send-marketing-blast`
Baseada em `send-promo-blast` (mesmos padrões: CORS estrito, validação JWT + `MASTER_ADMIN`, Resend SDK).

Aceita no body:
- `subject` (string)
- `bodyHtml` (string — texto do email, com parágrafos)
- `imageUrl` (string opcional — exibida no topo)
- `recipients` (array de `{ email, name? }`)
- `delaySeconds` (number, clamp entre 15 e 20)

Comportamento:
- Renderiza HTML usando template padrão Conectae (header com logo, imagem opcional, corpo, assinatura)
- Loop com `await delay(delaySeconds * 1000)` entre envios
- Retorna `{ total, sent, failed, errors }`
- Registra log por envio (console)

Configurada com `verify_jwt = true` em `supabase/config.toml`.

### 2. Novo componente `src/components/admin/EmailMarketingManagement.tsx`

Layout em duas colunas (responsivo):

**Coluna esquerda — Composição:**
- Input "Assunto"
- Input URL da imagem (com upload opcional para storage `creatives` ou similar já existente — verificar; se não, apenas URL)
- Textarea grande "Mensagem" (suporta quebras de linha; convertidas para `<p>` no HTML)
- Slider/Input "Delay entre envios (segundos)" — min 15, max 20, default 17
- Preview ao vivo do email renderizado (iframe ou div com HTML)

**Coluna direita — Destinatários:**
- Tabs: "Usuários cadastrados" | "Emails manuais"
- Aba Usuários:
  - Busca por nome/email
  - Botão "Selecionar todos" / "Limpar"
  - Lista com checkbox carregada de `profiles` (id, name, email, is_active=true)
  - Contador de selecionados
- Aba Manuais:
  - Textarea para colar emails (um por linha ou separados por vírgula)
  - Validação de formato
- Resumo total de destinatários únicos (dedupe por email)

**Rodapé:**
- Botão "Disparar emails" com confirmação (AlertDialog mostrando total, delay e tempo estimado)
- Durante envio: barra de progresso (chamada única à function, então mostramos estado "enviando..." e resultado final). *Observação: como a function é uma única chamada bloqueante, o progresso real granular não é exposto — mostramos spinner com tempo estimado e o relatório ao final.*

### 3. Integração no Admin

- `src/pages/Admin.tsx`: adicionar section `email-marketing` mapeando para `EmailMarketingManagement`
- `src/components/admin/AdminLayout.tsx`: novo item de navegação no grupo **Conteúdo** com ícone `Mail`, rota `/admin/email-marketing`
- `src/App.tsx`: adicionar rota correspondente (seguindo padrão das outras seções admin)

### 4. Detalhes técnicos

- Uso do cliente Supabase já existente para listar `profiles`
- Dedupe de emails (case-insensitive) antes de enviar
- Limite de tempo: como o disparo pode demorar (ex: 100 emails × 20s = 33min), avisar usuário no dialog de confirmação. Edge functions Supabase têm limite de execução; recomendar lotes ≤ 50 destinatários por disparo (validação no UI com aviso quando excede)
- Resend já configurado (`RESEND_API_KEY` secret existente, usado em `send-promo-blast`)
- Remetente: `Conectae <noreply@conectaeimob.com.br>` (mesmo de `send-promo-blast`)

## Arquivos

**Criar:**
- `supabase/functions/send-marketing-blast/index.ts`
- `supabase/functions/send-marketing-blast/deno.json` (com `resend`)
- `src/components/admin/EmailMarketingManagement.tsx`

**Editar:**
- `supabase/config.toml` (adicionar `[functions.send-marketing-blast]`)
- `src/pages/Admin.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/App.tsx`
