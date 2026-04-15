

# Plano: Créditos automáticos na página de confirmação

## Problema
Quando o pagamento de créditos é confirmado no Asaas, o webhook atualiza o saldo no banco de forma assíncrona. A página `CheckoutSuccess` atual:
1. Não diferencia compra de créditos vs compra de lead
2. Sempre redireciona para `/my-leads`
3. Não espera os créditos serem processados pelo webhook

## Solução

### 1. Atualizar `CheckoutSuccess.tsx`
- Detectar `?type=credits` na URL (já enviado pelo `create-credit-purchase`)
- Implementar **polling** que verifica o `credit_balance` do perfil a cada 2 segundos (máx 15 tentativas)
- Mostrar spinner "Processando seus créditos..." enquanto aguarda
- Quando os créditos forem confirmados, mostrar o saldo atualizado
- Redirecionar para `/leads-disponiveis` (não `/my-leads`) após confirmação de créditos
- Para compras de lead, manter o comportamento atual (redireciona para `/my-leads`)

### 2. Lógica de polling
- Buscar `credit_balance` do perfil do usuário logado
- Comparar com o saldo anterior (ou verificar se `credit_purchases` com status `PAID` existe)
- Consultar `credit_purchases` mais recente do usuário para verificar se o status mudou para `PAID`
- Quando confirmado: exibir mensagem de sucesso com o novo saldo e redirecionar para `/leads-disponiveis`

### 3. Fluxo visual
```text
Pagamento feito no Asaas
  → Redireciona para /checkout-success?type=credits
  → Mostra "Processando seus créditos..." com spinner
  → Polling a cada 2s verificando credit_purchases.status
  → Quando PAID: "Créditos adicionados! Saldo: X créditos"
  → Redireciona para /leads-disponiveis em 3 segundos
```

### Arquivos modificados
- `src/pages/CheckoutSuccess.tsx` — Adicionar detecção de tipo e polling de créditos

