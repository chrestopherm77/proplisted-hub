

## Plano: Ajustes Críticos em Campos de Valor e Unidade de Medida

### Resumo

Este plano implementa validações e formatações para:
1. **Campos de valor em REAIS** - Apenas numéricos com limite de R$ 50,00 (mín) a R$ 10.000.000,00 (máx)
2. **Campos de unidade de medida (m²)** - Apenas números, sem texto

---

## Campos Identificados

### Campos de Valor em REAIS (6 campos)

| Campo | Arquivo | Flow |
|-------|---------|------|
| expectedValue | SellValueStep.tsx | SELL |
| budgetMin | BuyLocationBudgetStep.tsx | BUY |
| budgetMax | BuyLocationBudgetStep.tsx | BUY |
| tradeOfferValue | BuyPaymentMethodStep.tsx | BUY |
| tradeOfferValue | BuildPaymentStep.tsx | BUILD |
| maxRent | RentLocationValueStep.tsx | RENT |

### Campos de Metragem em m² (5 campos)

| Campo | Arquivo | Flow |
|-------|---------|------|
| size | SellGeneralInfoStep.tsx | SELL |
| minSize | BuyCommercialPrefsStep.tsx | BUY |
| landMinSize | BuyLandPrefsStep.tsx | BUY |
| minSize | RentCommercialPrefsStep.tsx | RENT |

---

## Alterações

### 1. Atualizar `src/lib/validators.ts`

Adicionar novas funções:

```typescript
// Constantes de limites monetários
export const CURRENCY_MIN = 5000;      // R$ 50,00 em centavos
export const CURRENCY_MAX = 1000000000; // R$ 10.000.000,00 em centavos

// Formatação de moeda com limite (R$ 50 a R$ 10.000.000)
export function formatCurrencyWithLimits(value: string): string {
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  let amount = parseInt(numbers, 10);
  
  // Aplicar limite máximo (R$ 10.000.000,00 = 1.000.000.000 centavos)
  if (amount > CURRENCY_MAX) {
    amount = CURRENCY_MAX;
  }
  
  const formatted = (amount / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `R$ ${formatted}`;
}

// Validar se o valor está dentro dos limites
export function validateCurrencyLimits(value: string): { 
  valid: boolean; 
  message: string;
  amountInCents: number;
} {
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) {
    return { valid: false, message: 'Valor é obrigatório', amountInCents: 0 };
  }
  
  const amount = parseInt(numbers, 10);
  
  if (amount < CURRENCY_MIN) {
    return { 
      valid: false, 
      message: 'Valor mínimo é R$ 50,00',
      amountInCents: amount
    };
  }
  
  if (amount > CURRENCY_MAX) {
    return { 
      valid: false, 
      message: 'Valor máximo é R$ 10.000.000,00',
      amountInCents: amount
    };
  }
  
  return { valid: true, message: '', amountInCents: amount };
}

// Formatar apenas números para campos de área (m²)
export function formatArea(value: string): string {
  // Remove tudo exceto dígitos
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Limitar a um valor razoável (máximo 99.999.999 m²)
  const num = Math.min(parseInt(numbers, 10), 99999999);
  
  return num.toString();
}
```

---

### 2. Atualizar Campos de Valor em REAIS

#### 2.1 `SellValueStep.tsx`
- Substituir `formatCurrency` por `formatCurrencyWithLimits`

#### 2.2 `BuyLocationBudgetStep.tsx`
- Substituir `formatCurrency` por `formatCurrencyWithLimits` nos campos `budgetMin` e `budgetMax`

#### 2.3 `BuyPaymentMethodStep.tsx`
- Substituir `formatCurrency` por `formatCurrencyWithLimits` no campo `tradeOfferValue`

#### 2.4 `BuildPaymentStep.tsx`
- Substituir `formatCurrency` por `formatCurrencyWithLimits` no campo `tradeOfferValue`

#### 2.5 `RentLocationValueStep.tsx`
- Substituir `formatCurrency` por `formatCurrencyWithLimits` no campo `maxRent`

---

### 3. Atualizar Campos de Metragem (m²)

#### 3.1 `SellGeneralInfoStep.tsx`
- Importar `formatArea` e usar no campo `size`
- Atualizar placeholder para "Ex: 150" (sem "m²" no input)
- O sufixo "m²" será exibido na label

#### 3.2 `BuyCommercialPrefsStep.tsx`
- Importar `formatArea` e usar no campo `minSize`
- Atualizar placeholder para "Ex: 50"

#### 3.3 `BuyLandPrefsStep.tsx`
- Importar `formatArea` e usar no campo `landMinSize`
- Atualizar placeholder para "Ex: 300"

#### 3.4 `RentCommercialPrefsStep.tsx`
- Importar `formatArea` e usar no campo `minSize`
- Atualizar placeholder para "Ex: 50"

---

### 4. Adicionar Validação no Wizard

Atualizar `LeadFormWizard.tsx` para validar os limites monetários antes de avançar nas etapas relevantes.

---

## Resumo Visual das Mudanças

```text
ANTES (Campos de Valor):
├── Input aceita qualquer texto
├── Sem limite mínimo/máximo
└── Formatação: R$ X.XXX,XX

DEPOIS (Campos de Valor):
├── Input aceita APENAS números
├── Limite: R$ 50,00 a R$ 10.000.000,00
└── Formatação: R$ X.XXX,XX (com cap automático)

ANTES (Campos de Área):
├── Input aceita texto (Ex: "150 m²")
└── Sem formatação

DEPOIS (Campos de Área):
├── Input aceita APENAS números
├── Placeholder mostra apenas número
└── Sufixo "m²" na label do campo
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| src/lib/validators.ts | Adicionar funções de formatação/validação |
| src/components/leadform/steps/sell/SellValueStep.tsx | Usar formatCurrencyWithLimits |
| src/components/leadform/steps/sell/SellGeneralInfoStep.tsx | Usar formatArea |
| src/components/leadform/steps/buy/BuyLocationBudgetStep.tsx | Usar formatCurrencyWithLimits |
| src/components/leadform/steps/buy/BuyCommercialPrefsStep.tsx | Usar formatArea |
| src/components/leadform/steps/buy/BuyLandPrefsStep.tsx | Usar formatArea |
| src/components/leadform/steps/buy/BuyPaymentMethodStep.tsx | Usar formatCurrencyWithLimits |
| src/components/leadform/steps/build/BuildPaymentStep.tsx | Usar formatCurrencyWithLimits |
| src/components/leadform/steps/rent/RentLocationValueStep.tsx | Usar formatCurrencyWithLimits |
| src/components/leadform/steps/rent/RentCommercialPrefsStep.tsx | Usar formatArea |

---

## Detalhes Técnicos

### Constantes de Limite
- **Mínimo**: R$ 50,00 = 5000 centavos
- **Máximo**: R$ 10.000.000,00 = 1.000.000.000 centavos

### Comportamento do Input
1. Usuário digita números
2. Sistema formata em tempo real com máscara
3. Se exceder máximo, trunca para R$ 10.000.000,00
4. Validação final no submit verifica mínimo de R$ 50,00

### Campos de Área
1. Aceita apenas dígitos
2. Limite máximo de 99.999.999 m² (prevenção de overflow)
3. Não exibe "m²" no input, apenas na label

