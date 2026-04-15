

# Diagnóstico: Créditos não aparecem após pagamento

## Problema encontrado

Analisei o banco de dados e encontrei o seguinte:

1. **As duas compras de créditos (625 cada) estão com status `PENDING`** — nunca foram atualizadas para `PAID`
2. **Nenhum webhook do Asaas foi recebido** para essas compras — a tabela `asaas_webhook_events` não tem nenhum registro com referência `credits_`
3. **O saldo de créditos está em 0** porque o webhook nunca chegou para processar o pagamento

**Causa raiz**: O Asaas Sandbox tem configuração de webhook **separada** da produção. O webhook URL precisa ser configurado no painel do sandbox.asaas.com, e o webhook secret do sandbox pode ser diferente do de produção.

## Solução (2 partes)

### Parte 1: Configuração no Asaas Sandbox (ação manual)
Você precisa acessar **sandbox.asaas.com** → Configurações → Integrações → Webhooks e configurar:
- **URL**: `https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/asaas-webhook`
- **Token de autenticação**: o mesmo valor que está no secret `ASAAS_WEBHOOK_SECRET`
- **Eventos**: ativar todos os eventos de pagamento e checkout

### Parte 2: Melhorias no código (robustez)

**Arquivo: `supabase/functions/asaas-webhook/index.ts`**
- Adicionar log mais claro quando webhook de créditos é recebido
- Garantir que o campo `confirmed_at` seja atualizado corretamente

**Arquivo: `src/pages/CheckoutSuccess.tsx`**
- Quando o polling falhar (15 tentativas sem sucesso), mostrar botão "Verificar novamente" que faz nova tentativa
- Adicionar fallback que consulta a API do Asaas diretamente via edge function para verificar status do pagamento

**Nova edge function: `check-credit-status/index.ts`**
- Recebe o ID da compra de créditos mais recente do usuário
- Consulta a API do Asaas para verificar se o pagamento foi confirmado
- Se confirmado, atualiza o `credit_purchases` para `PAID` e adiciona os créditos ao perfil
- Isso serve como fallback caso o webhook não chegue

### Parte 3: Corrigir as compras pendentes atuais
- Migration SQL para atualizar as 2 compras pendentes para `PAID` e adicionar 1250 créditos (625 × 2) ao perfil do usuário

### Arquivos modificados
- `src/pages/CheckoutSuccess.tsx` — botão de retry e chamada ao fallback
- `supabase/functions/check-credit-status/index.ts` — nova edge function de fallback
- `supabase/functions/asaas-webhook/index.ts` — melhorias de log
- Migration SQL — corrigir compras pendentes atuais

