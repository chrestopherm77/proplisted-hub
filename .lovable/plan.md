
Objetivo: corrigir o envio da primeira mensagem de confirmação no WhatsApp, porque hoje o sistema pode marcar como “enviado” mesmo quando a Mega API não aceitou de fato a mensagem interativa.

Diagnóstico encontrado
- A primeira mensagem é enviada por `supabase/functions/send-lead-confirmation/index.ts` usando o endpoint `listMessage`.
- O código atual considera sucesso apenas porque a resposta HTTP veio `200`.
- Pela documentação da Mega API, mesmo com `200` ela ainda retorna campos como `error` e `message`.
- Hoje o código não lê esse corpo de resposta. Então:
  - pode estar falhando para alguns números;
  - o log fica como sucesso mesmo assim;
  - o botão de reenviar no admin também mostra sucesso falso;
  - por isso a mensagem “não aparece no seu WhatsApp”, embora o sistema diga que enviou.

Plano de correção
1. Ajustar `send-lead-confirmation`
- Ler o JSON retornado pela Mega API.
- Só considerar sucesso quando:
  - HTTP for OK
  - e `error !== true`
- Registrar no log:
  - número normalizado
  - `message`
  - `id`
  - `remoteJid`
  - payload resumido de erro quando houver

2. Criar fallback automático
- Se o `listMessage` falhar, disparar uma mensagem de texto simples no endpoint `/text`.
- Assim o lead pelo menos recebe a primeira mensagem, mesmo se o formato interativo não for aceito para aquele número.

3. Melhorar o retorno para o admin
- Fazer `send-lead-confirmation` devolver status real:
  - `sent_interactive`
  - `sent_fallback_text`
  - `failed`
- Atualizar `src/components/admin/LeadTracking.tsx` para mostrar toast correto, em vez de sempre “Confirmação reenviada via WhatsApp!”.

4. Opcional, mas recomendado: persistir rastreio do envio
- Adicionar campos no lead, por exemplo:
  - `confirmation_whatsapp_status`
  - `confirmation_whatsapp_error`
  - `confirmation_whatsapp_message_id`
  - `confirmation_whatsapp_sent_at`
- Isso permite saber no admin exatamente por que cada envio falhou.

5. Validar a estratégia de número
- Manter a normalização atual, mas instrumentar logs para comparar os casos que falham.
- Se a Mega estiver rejeitando parte dos números por causa do formato com remoção do 9, eu ajusto a regra para tentar:
  - formato atual
  - e, se falhar, uma segunda tentativa com o número completo

Arquivos envolvidos
- `supabase/functions/send-lead-confirmation/index.ts`
- `src/components/admin/LeadTracking.tsx`
- possivelmente uma migration nova, se formos salvar status detalhado no banco

Resultado esperado
- Parar de ter “sucesso falso”.
- Saber exatamente por que Eduardo, Helena e Sandro não receberam.
- Garantir que, se a mensagem interativa falhar, a mensagem simples ainda chegue.
- Deixar o reenviar manual confiável e auditável.

Detalhe técnico importante
- O problema mais provável não é o formulário nem o lead em si.
- O ponto fraco está no tratamento da resposta da Mega API no primeiro disparo.
- Hoje o sistema faz, na prática:
  - “recebi 200 = enviado”
- A correção será:
  - “recebi 200 + corpo válido sem erro = enviado”
  - senão registrar falha e tentar fallback.

Sequência de implementação
1. corrigir parsing e validação da resposta da Mega API
2. adicionar fallback para texto simples
3. ajustar toast/status do admin
4. testar reenvio com números que falharam
5. se necessário, instrumentar e ajustar a normalização do telefone
