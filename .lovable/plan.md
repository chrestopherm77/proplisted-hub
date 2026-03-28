

## Corrigir tradução de valores no e-mail de notificação de leads

### Problema
Os e-mails enviados aos corretores mostram valores brutos em inglês (ex: `unknown`, `up_to_30_days`, `immediately`) em vez de traduções em português. Isso acontece porque os mapeamentos de tradução no edge function `notify-new-lead` não cobrem todos os valores que o formulário envia.

### Valores faltando no edge function

| Mapa | Valores faltando |
|------|-----------------|
| `guaranteeLabels` | `capitalization` → "Título de capitalização", `unknown` → "Ainda não sei" |
| `moveInDeadlineLabels` | `immediately` → "Imediatamente", `up_to_30_days` → "Até 30 dias", `more_than_3_months` → "Mais de 3 meses" |
| `btsRentRangeLabels` | `up_to_30` → "Até R$ 30/m²", `undefined` → "Ainda não defini" |
| `btsContractTermLabels` | `7_to_10_years` → "7 a 10 anos", `10_to_15_years` → "10 a 15 anos", `above_15_years` → "Acima de 15 anos", `undefined` → "Ainda não defini" |

### Alteração

**Arquivo:** `supabase/functions/notify-new-lead/index.ts`

Adicionar as entradas faltantes em cada mapa de labels para que todos os valores do formulário sejam traduzidos corretamente. Após a edição, fazer deploy do edge function.

