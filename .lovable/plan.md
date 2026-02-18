

## Alterar Valor Fixo do Lead para R$ 27,00

### Resumo

Atualmente, os leads criados pelo formulario `/lp` sao publicados com preco fixo de **R$ 15,00**. Vamos alterar para **R$ 27,00**.

---

### Alteracao

| Arquivo | O que muda |
|---------|------------|
| `src/components/leadform/LeadFormWizard.tsx` | Alterar `DEFAULT_LEAD_PRICE` de `15.00` para `27.00` |

Essa e a unica variavel que controla o preco dos leads criados via formulario. Os leads ja existentes no banco nao serao afetados -- apenas novos leads criados a partir da mudanca terao o valor de R$ 27,00.

### Observacao

O preco de cada lead e validado no backend (Edge Function `create-payment`) buscando o valor diretamente do banco de dados, entao nao ha risco de inconsistencia. O valor R$ 27,00 tambem esta acima do minimo de R$ 5,00 exigido pelo Asaas.

