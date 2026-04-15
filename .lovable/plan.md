

# Voltar Asaas para Produção

## Resumo
O código já está preparado para alternar entre sandbox e produção via a secret `ASAAS_SANDBOX_MODE`. Basta alterar o valor dessa secret de `true` para `false`.

## O que acontece
- As 4 edge functions (`create-payment`, `create-credit-purchase`, `check-credit-status`, `asaas-webhook`) já fazem a checagem automática:
  - Se `ASAAS_SANDBOX_MODE === 'true'` → usa `ASAAS_SANDBOX_API_KEY` + `sandbox.asaas.com`
  - Se `false` → usa `ASAAS_API_KEY` + `api.asaas.com`

## Ação necessária
1. Atualizar a secret `ASAAS_SANDBOX_MODE` para o valor `false`
2. Confirmar que a secret `ASAAS_API_KEY` já está configurada com a chave de produção do Asaas

Nenhuma alteração de código é necessária.

