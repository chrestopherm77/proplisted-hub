
Objetivo: corrigir o envio de WhatsApp dos alertas/ofertas e alinhar tudo com o comportamento que já funciona no financiamento.

Diagnóstico do que encontrei:
- A página de financiamento funciona porque a função `send-financing-whatsapp` envia para um número fixo já no formato que funciona: `553191914663`.
- Já os fluxos de alerta salvo e oferta usam o telefone salvo em `profiles.phone`.
- Os registros existem e batem com o teste que você fez:
  - alerta salvo do usuário `chresautomacao`
  - nova procura/oferta do usuário `chrestopher`
- Para os dois usuários envolvidos, o telefone salvo está como `31991914663` / `(31) 99191-4663`, ou seja: com o 9 local.
- As funções `notify-alert-match` e `notify-offer-whatsapp` até tentam normalizar o número, mas hoje esse comportamento está espalhado e o fluxo do frontend ainda é frágil:
  - `notify-offer-whatsapp` é chamado em “fire-and-forget”, sem validar resposta
  - `notify-alert-match` usa `fetch` direto, sem tratamento forte de erro
  - não apareceram logs recentes dessas funções, então além do formato do número, o disparo está sem visibilidade e pode estar falhando silenciosamente

Plano de ajuste:
1. Padronizar a normalização de telefone
- Criar uma única regra de normalização para números brasileiros no formato aceito pela API externa.
- Essa regra vai sempre converter números como `31991914663` para `553191914663` no momento do envio.
- Aplicar a mesma regra em:
  - `notify-alert-match`
  - `notify-offer-whatsapp`
  - `notify-launch-alert-match`
  - `check-whatsapp`
- Assim, todo envio passa a usar exatamente o mesmo padrão do financiamento.

2. Ajustar o disparo no frontend para não falhar silenciosamente
- Trocar os `fetch` diretos dos fluxos de parceria por chamadas mais confiáveis, com resposta verificada.
- No fluxo de oferta, remover o comportamento “dispara e esquece” como está hoje, porque ele mascara erro.
- Manter a UI rápida, mas com confirmação real do backend.

3. Corrigir internamente o seu número no sistema
- Normalizar os perfis envolvidos no banco para evitar divergência entre contas que usam o mesmo WhatsApp.
- O objetivo é deixar o backend sempre resolvendo para o número que efetivamente funciona no envio.

4. Melhorar rastreabilidade
- Adicionar logs claros nas funções com:
  - telefone original
  - telefone normalizado
  - status retornado pela API externa
- Isso evita nova investigação “no escuro”.

5. Validar ponta a ponta após o ajuste
- Reexecutar manualmente os 2 cenários:
  - alerta salvo → nova procura compatível
  - oferta com link → notificação ao dono da procura
- Confirmar que ambos saem para `553191914663`.

Detalhes técnicos:
- Arquivos principais a ajustar:
  - `supabase/functions/notify-alert-match/index.ts`
  - `supabase/functions/notify-offer-whatsapp/index.ts`
  - `supabase/functions/notify-launch-alert-match/index.ts`
  - `supabase/functions/check-whatsapp/index.ts`
  - `src/pages/PropertySearches.tsx`
  - `src/pages/NewPropertySearch.tsx`
- Causa mais provável:
  - o financiamento não depende do `profiles.phone`, por isso funciona
  - alertas/ofertas dependem do telefone do perfil + chamadas menos robustas, então o erro aparece só nesses fluxos

Quando você aprovar, eu implemento os ajustes, normalizo o número internamente e testo os dois disparos manualmente.