## Troca da conta Asaas

O sistema só depende da **conta Asaas via chaves de API + webhook** — não há `walletId`, split, nem dados da conta gravados no banco. A estrutura permanece igual, basta substituir as credenciais e reconfigurar o webhook na nova conta. Abaixo está tudo que você precisa fazer.

---

### 1. Variáveis usadas pelo sistema (já existem nos Secrets)

| Secret | Para que serve | Onde é usado |
|---|---|---|
| `ASAAS_API_KEY` | Chave de **produção** da conta Asaas | create-payment, create-credit-purchase, create-subscription, cancel-subscription, asaas-webhook, check-credit-status, reconcile-asaas-payments |
| `ASAAS_SANDBOX_API_KEY` | Chave de **sandbox** (testes) | mesmas funções acima |
| `ASAAS_SANDBOX_MODE` | `true` → usa sandbox · `false` (ou vazio) → usa produção | mesmas funções acima |
| `ASAAS_WEBHOOK_SECRET` | Token enviado pelo Asaas no header `asaas-access-token` e validado pelo webhook | asaas-webhook |

> Não há `wallet_id`, conta bancária, CPF/CNPJ do recebedor nem split configurado no código. Toda receita cai diretamente na conta dona da `ASAAS_API_KEY`.

---

### 2. Passo a passo na NOVA conta Asaas

**A) Criar a chave de API de produção**
1. Entrar na nova conta em https://www.asaas.com (Produção).
2. Menu **Integrações → Chave da API → Gerar nova chave**.
3. Copiar a chave (`$aact_prod_...`).

**B) (Opcional) Criar a chave de Sandbox**
1. Entrar em https://sandbox.asaas.com com a mesma conta/e-mail.
2. **Integrações → Chave da API → Gerar nova chave**.
3. Copiar a chave (`$aact_hmlg_...`).

**C) Configurar o Webhook na nova conta** (precisa ser feito tanto em Produção quanto em Sandbox, se for usar os dois)
1. **Integrações → Webhooks → Adicionar webhook**.
2. **URL**: `https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/asaas-webhook`
3. **Versão da API**: v3
4. **Email para notificações de falha**: e-mail seu/do time.
5. **Habilitar autenticação personalizada (Token de acesso)**:
   - Nome do header: `asaas-access-token`
   - Valor: **o mesmo valor que vai ficar em `ASAAS_WEBHOOK_SECRET`** (você pode manter o atual, gerar um novo é opcional).
6. **Eventos a marcar** (todos os que o sistema processa hoje):
   - `CHECKOUT_CREATED`
   - `CHECKOUT_PAID`
   - `CHECKOUT_CONFIRMED`
   - `CHECKOUT_EXPIRED`
   - `CHECKOUT_CANCELED`
   - `PAYMENT_CREATED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_REFUNDED`
   - `PAYMENT_DELETED`
   - `SUBSCRIPTION_CREATED`
   - `SUBSCRIPTION_UPDATED`
   - `SUBSCRIPTION_DELETED`

**D) Atualizar os Secrets no Lovable Cloud**
- `ASAAS_API_KEY` → nova chave de produção
- `ASAAS_SANDBOX_API_KEY` → nova chave de sandbox (se for usar)
- `ASAAS_WEBHOOK_SECRET` → mesmo valor que você colocou no header do webhook
- `ASAAS_SANDBOX_MODE` → `false` para produção / `true` para sandbox (deixe como está hoje)

> Não precisa mexer em código, edge functions, banco ou domínio. As funções leem o secret em runtime.

---

### 3. Importante sobre dados já existentes

Pagamentos antigos têm `asaas_payment_id`, `asaas_customer_id` e `asaas_checkout_id` **da conta antiga** salvos em `purchases`, `credit_purchases`, `subscription_payments` e `user_subscriptions`. Depois da troca:

- **Cobranças avulsas antigas (pendentes)** que ainda não pagaram **não serão mais confirmadas** automaticamente — o webhook só recebe eventos da conta nova. Recomendação: deixar a chave antiga acessível por alguns dias só para reconciliação manual via `reconcile-asaas-payments`, ou cancelar essas cobranças no painel antigo.
- **Assinaturas recorrentes ativas (créditos mensais)** rodam dentro do Asaas. Como a conta vai mudar, elas **não serão cobradas pela conta nova automaticamente**. Tem dois caminhos:
  1. **Migrar manualmente**: criar novas assinaturas na conta nova para cada cliente ativo (a função `create-subscription` faz isso quando o cliente acessa o checkout de novo).
  2. **Manter as antigas rodando** na conta velha até cada uma vencer naturalmente — para isso a conta antiga precisa continuar ativa e o webhook dela apontando para o mesmo endpoint (o webhook do sistema aceita qualquer evento que bata com o token).

> Decida qual estratégia quer usar para as assinaturas antes da troca para não derrubar a renovação dos clientes.

---

### 4. Plano de execução (sem código novo)

1. Você cria a nova conta + chaves + webhook conforme passos A–C acima.
2. Quando estiver pronto, eu chamo `update_secret` para `ASAAS_API_KEY`, `ASAAS_SANDBOX_API_KEY` e (se quiser mudar) `ASAAS_WEBHOOK_SECRET`. Você cola os valores no formulário seguro.
3. Validamos com um pagamento de teste em sandbox (ou um PIX baixo em produção) e olhamos os logs de `asaas-webhook` para confirmar o `200 OK`.
4. Decidir o que fazer com assinaturas/cobranças pendentes da conta antiga.

Sem alterações em arquivos, migrations, ou edge functions — só rotação de secrets e config no painel do Asaas.