

## Dashboard baseado em compras de crédito (dinheiro real)

Hoje o Dashboard e a aba "Compras" leem da tabela `purchases`, que registra **compra de leads usando créditos** (não é dinheiro novo entrando). Por isso o "Total de Compras" e a "Receita Total" aparecem inflados/duplicados — cada lead comprado com créditos vira uma linha de "venda".

A receita real entra em `credit_purchases` (quando alguém paga PIX/cartão para comprar pacote de créditos).

### Mudança de lógica

**Receita / Vendas = `credit_purchases` com `status = 'PAID'`**
- Total Receita = soma de `amount` de `credit_purchases` pagos.
- Total de Compras = quantidade de `credit_purchases` pagos.
- Gráfico de receita 30 dias = baseado em `credit_purchases.confirmed_at`.
- Gráfico "Vendas por Status" = status de `credit_purchases`.

**Aba "Compras" passa a mostrar compras de créditos**, com colunas:
Data | Cliente | Pacote | Créditos | Valor pago | Forma | Status

**Nova aba "Compra de Leads"** mostra o que hoje está em `purchases` (lead + comprador + créditos gastos + data) — ou seja, o consumo de créditos em leads, sem contar como receita.

### Arquivos afetados

- `src/components/admin/DashboardStats.tsx`
  - Trocar consulta de `purchases` para `credit_purchases` nos cards "Receita Total" e "Total de Compras".
  - "Leads Ativos" e "Usuários" continuam iguais.
- `src/components/admin/RevenueChart.tsx`
  - Ler de `credit_purchases` (`amount`, `confirmed_at`, `status='PAID'`).
- `src/components/admin/SalesByStatusChart.tsx`
  - Ler status de `credit_purchases`.
- `src/components/admin/PurchasesOverview.tsx`
  - Refazer para listar `credit_purchases` joinando com `credit_packages` (nome) e `profiles` (cliente). Colunas: Data, Cliente, Pacote, Créditos, Valor, Forma, Status.
- **Novo** `src/components/admin/LeadPurchasesOverview.tsx`
  - Move a listagem atual (compra de lead com créditos) para cá: Data, Comprador, Lead, Créditos gastos.
- `src/pages/Admin.tsx`
  - Renomear aba `Compras` → `Compras (Créditos)` e adicionar nova aba `Compra de Leads` apontando para `LeadPurchasesOverview`.

### Sobre os dados atuais

Você disse que houve só 2 compras reais (R$125 e R$27). No banco estão registradas **4 compras pagas** em `credit_purchases`:
- R$125 — 2026-04-21 (usuário 50a3...)
- R$220 — 2026-04-15 (usuário 8143...)
- R$125 — 2026-04-15 (usuário 8143...)
- R$28 — 2026-04-15 (usuário 4915...)

Não vou apagar nada sem confirmação. Após implementar a lógica nova, se quiser que eu **inative** ou **delete** as compras de R$125 e R$220 do dia 15/04 do usuário 8143... (parecem ser teste), me avise no próximo turno que eu faço.

### O que NÃO muda

- Tabelas `purchases` e `credit_purchases` continuam como estão.
- Saldo de créditos dos usuários, fluxo de checkout Asaas, webhook.
- RLS, edge functions.

### Resultado

- Dashboard reflete **dinheiro real entrando** (compras de pacote de créditos).
- Aba "Compras (Créditos)" lista apenas vendas com receita real.
- Aba nova "Compra de Leads" mostra o consumo de créditos em leads, sem contar como receita.

