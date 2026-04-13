
Problema identificado: o erro não indica mais “Mega API fora do ar” de forma genérica. A causa mais provável está no endpoint usado pela função de financiamento.

O que encontrei no código:
- `send-financing-whatsapp` usa `https://api.megaapi.com.br/rest/sendMessage/...`
- As outras integrações Mega que já funcionam no projeto (`send-whatsapp-code`, `check-whatsapp`, `recovery-abandoned-lead`) usam `https://apinocode01.megaapi.com.br/...`
- Nos logs da função de financiamento, o retorno foi um HTML de Cloudflare Tunnel error 1033 para `api.megaapi.com.br`
- Isso mostra que a função está chamando um host diferente do restante do sistema, e esse host é o que está falhando

Plano de correção:
1. Ajustar `supabase/functions/send-financing-whatsapp/index.ts`
- Trocar o host de envio de:
  - `api.megaapi.com.br`
  para:
  - `apinocode01.megaapi.com.br`
- Manter a mesma rota `/rest/sendMessage/megacode-Mj46Nd4U5tP/text`
- Manter token, payload e número de destino como já estão

2. Melhorar diagnóstico da função
- Padronizar a resposta para sempre retornar JSON legível ao frontend
- Incluir detalhes internos de diagnóstico no log:
  - URL chamada
  - status HTTP retornado
  - trecho da resposta da Mega
- Se a Mega falhar, retornar mensagem estruturada para o frontend em vez de depender só de status 502

3. Melhorar o frontend em `src/pages/Financing.tsx`
- Ler o corpo retornado pela função (`data`) além de `error`
- Exibir mensagem específica quando a função retornar falha estruturada
- Evitar o erro genérico “Erro ao enviar simulação” quando já houver mensagem melhor disponível

4. Validação final
- Confirmar que a função de financiamento ficou alinhada com o mesmo padrão já usado nas integrações de WhatsApp do projeto
- Testar o envio novamente após a troca do endpoint

Arquivos afetados:
- `supabase/functions/send-financing-whatsapp/index.ts`
- `src/pages/Financing.tsx`

Detalhe técnico:
O indício principal é a inconsistência entre hosts:
```text
Funcionando no projeto:
apinocode01.megaapi.com.br

Falhando no financiamento:
api.megaapi.com.br
```
Como os outros fluxos já usam `apinocode01`, a correção mais segura é alinhar a função de financiamento ao mesmo endpoint.
