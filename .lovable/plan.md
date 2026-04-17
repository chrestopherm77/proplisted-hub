

## Diagnóstico: lead novo não disparou no grupo + megafone manual também falhou

### Causa raiz dos dois problemas
Ambos chegam até a Mega API, mas ela responde **HTTP 200 com `{ error: true, name: "INTERNAL_SERVER_ERROR", statusCode: 500 }`** ao tentar enviar texto para o grupo `120363410244397205@g.us`.

Log de hoje (14:19, momento exato do clique no megafone):
```
Mega API response: 200 - {"error":true,"name":"INTERNAL_SERVER_ERROR","message":"Internal Server Error","statusCode":500}
```

### Por que cada caso falhou

**1. Lead automático (Lucia Alves, 16/04)**
Não disparou porque a Lucia **nunca confirmou pelo WhatsApp**:
- `whatsapp_confirmed = false`
- `is_active = false`
- `confirmation_whatsapp_status = "sent_interactive"` (a mensagem de confirmação foi enviada, mas ela não respondeu)

O envio para o grupo está dentro do `mega-webhook`, **só roda quando a pessoa clica "Confirmar" no WhatsApp**. Se ela não confirma, o webhook nunca é chamado, então nunca dispara para o grupo. Esse fluxo está funcionando como projetado — mas o lead não chegou a ser ativado, então o grupo não devia mesmo receber.

> Importante: o lead que ESTÁ ativo e disponível agora é o **Eduardo (15/04 23:24)**. Esse foi confirmado e provavelmente disparou o webhook na hora — só que os logs daquele dia já expiraram, então não conseguimos ver. Mas pelo padrão atual da Mega API retornando 500, é altíssima probabilidade que o disparo do Eduardo também tenha falhado silenciosamente.

**2. Megafone manual (`notify-lead-group`)**
Função executou normalmente, autenticou admin, montou a mensagem, chamou a Mega API → **a Mega API respondeu 500 (Internal Server Error)**.

A função até loga e devolve erro 500 pro front, mas o problema **não é nosso código** — é o servidor da Mega API.

### Bugs reais no nosso código (independentes da Mega API)

1. **Detecção falha de erro**: tanto `mega-webhook` quanto outras funções tratam `res.ok = true` como sucesso. Mas a Mega devolve **HTTP 200 com `error: true` no body**. Resultado: registramos como "enviado" mesmo quando não foi. O `notify-lead-group` está OK aqui (loga o body inteiro), mas o `mega-webhook` (linha 185-190) faz `await fetch(...)` e nem lê a resposta — falha do grupo passa totalmente despercebida.

2. **Sem retry**: chamadas para a Mega API no `mega-webhook` e no `notify-lead-group` não têm retry (só `notify-group-new-search` e `notify-offer-whatsapp` têm). Como a Mega às vezes devolve 500 transiente, um retry resolveria muitos casos.

3. **Sem logs persistentes**: quando dá erro, ficamos dependentes da janela curta de logs do edge runtime para diagnosticar.

### Plano de correção

#### A. Corrigir detecção de erro da Mega API (em todas as funções de envio)
Trocar `if (res.ok)` por `if (res.ok && !parsedBody.error)` — checar tanto o status HTTP quanto o `error` no body JSON.

#### B. Padronizar `sendMegaMessage` com retry
Extrair a lógica do `notify-group-new-search` (que já tem retry com backoff) e aplicar em:
- `supabase/functions/mega-webhook/index.ts` — bloco de envio de grupo (linhas 124-195)
- `supabase/functions/notify-lead-group/index.ts` — chamada da Mega API
- (Manter `notify-group-new-search` e `notify-offer-whatsapp` que já fazem certo)

#### C. Mensagem clara no admin quando o megafone falhar
No `LeadsManagement.tsx` (linha ~469), tratar resposta de erro da função e mostrar toast: "Falha ao enviar para o grupo: a API do WhatsApp está retornando erro. Tente novamente em alguns minutos."

#### D. Adicionar log do body da resposta no `mega-webhook` (atualmente cego)
Substituir o `await fetch(...)` direto por chamada que lê o body, detecta `error: true` e loga claramente.

### O que NÃO vou fazer
- **Não vou alterar o GROUP_ID** — ele está consistente em todas as 3 funções, e a `notify-group-new-search` (mesmo group ID, mesma instância) também já apresentou sucesso histórico. O problema é instabilidade da Mega API, não config errada.
- **Não vou criar tabela de logs** — overkill por enquanto. Se persistir, fazemos depois.

### Recomendação ao usuário
Tente o megafone manual de novo daqui a alguns minutos: instabilidades da Mega API costumam ser transientes. Se mesmo assim falhar repetidamente, o problema está no lado deles e precisa abrir suporte com a Mega API.

### Arquivos a editar
- `supabase/functions/mega-webhook/index.ts` (envio de grupo + retry + detecção `error: true`)
- `supabase/functions/notify-lead-group/index.ts` (retry + detecção `error: true`)
- `src/components/admin/LeadsManagement.tsx` (mensagem de erro no toast do botão megafone)

