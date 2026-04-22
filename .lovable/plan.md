

## Validação: valor máximo ≥ valor mínimo nos formulários /lp e /lp-01

### O que muda

Adicionar validação nos campos de orçamento (mín/máx) para impedir avançar quando o valor máximo for menor que o mínimo. Aplica nas etapas de **Comprar** (`BuyLocationBudgetStep`) — único step com par mín/máx nos flows /lp e /lp-01.

### Comportamento

- Enquanto o usuário digita, se `budgetMax < budgetMin`, mostra mensagem em vermelho abaixo dos campos: **"O valor máximo deve ser maior ou igual ao mínimo."**
- O botão "Continuar" da etapa fica desabilitado até a relação ficar válida (ou um dos campos vazio).
- Se o usuário tentar avançar via `LeadFormNavigation`, a validação bloqueia com toast de erro.

### Arquivos afetados

1. **`src/components/leadform/steps/buy/BuyLocationBudgetStep.tsx`**
   - Comparar centavos de `budgetMin` vs `budgetMax` (extrair dígitos via regex, igual já feito em `validators.ts`).
   - Renderizar `<p className="text-sm text-destructive">` quando inválido.
   - Expor o estado de validade para o navigation (via prop existente do `StepProps` — checar se há `setStepValid` ou via leitura direta no `LeadFormWizard`).

2. **`src/components/leadform/LeadFormWizard.tsx`** (se necessário)
   - No mapa de validação por step, adicionar regra para a etapa de localização/orçamento de COMPRAR: `budgetMax >= budgetMin` quando ambos preenchidos.
   - Isso garante que o botão "Continuar" respeite a regra de forma centralizada.

### Detalhes técnicos

- Helper local `parseCurrencyToCents(value: string): number` — `parseInt(value.replace(/\D/g,'')||'0', 10)`.
- Considerar válido quando: ambos vazios, só um preenchido, ou `max >= min`.
- Sem alteração em backend, schema, edge functions ou em outros flows (RENT só tem `maxRent`, BUILD só tem `budget` único — não precisam dessa regra).
- Mantém o `formatCurrencyWithLimits` já existente para formatação.

### Resultado

Nos formulários `/lp` e `/lp-01`, ao escolher **Comprar**, o usuário não consegue mais enviar um intervalo inválido (ex.: mín R$ 500.000 e máx R$ 300.000). Mensagem clara aparece e o avanço fica bloqueado até corrigir.

