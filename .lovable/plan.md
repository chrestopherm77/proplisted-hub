

## Plano: Ajustes no Formulário de Cadastro (/lp)

### Resumo

Realizar 3 ajustes de copy e lógica no formulário de leads:

1. Alterar subtítulo do orçamento no fluxo "Construir"
2. Remover pergunta de dormitórios para imóveis comerciais no fluxo "Vender"
3. Alterar "possui" para "recusou" na pergunta sobre preferência do ocupante

---

## Alterações a Realizar

### 1. Orçamento Estimado (Construir)

**Arquivo:** `src/components/leadform/steps/build/BuildBudgetStep.tsx` (linha 18)

| Atual | Novo |
|-------|------|
| "Qual o orçamento estimado para a obra (considerando ou não o terreno)?" | "Qual o orçamento estimado para a obra sem considerar o terreno" |

---

### 2. Remover Pergunta de Dormitórios (Comercial)

**Arquivo:** `src/components/leadform/steps/sell/SellCommercialTypeStep.tsx`

**Remover:** Linhas 41-57 (bloco inteiro da pergunta de dormitórios)

```jsx
// REMOVER ESTE BLOCO:
<div className="space-y-4">
  <h3 className="text-lg font-medium flex items-center gap-2">
    <Bed className="h-5 w-5 text-primary" />
    Quantos dormitórios o imóvel possui?
  </h3>
  <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
    {bedroomOptions.map((option) => (
      <OptionCard
        key={option}
        label={option}
        isSelected={data.sell?.commercialBedrooms === option}
        onClick={() => updateFlowData('sell', { commercialBedrooms: option })}
        className="py-4"
      />
    ))}
  </div>
</div>
```

**Também remover:**
- Linha 4: Import de `Bed` (deixar apenas Bath, Car, etc.)
- Linha 15: `const bedroomOptions = ['1', '2', '3', '4+'];`

---

### 3. Alterar Texto da Preferência do Ocupante

**Arquivo:** `src/components/leadform/steps/sell/SellPropertyStatusStep.tsx` (linha 64)

| Atual | Novo |
|-------|------|
| "O ocupante possui direito de preferência?" | "O ocupante recusou direito de preferência?" |

---

## Detalhes Técnicos

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `BuildBudgetStep.tsx` | Alterar subtítulo (1 linha) |
| `SellCommercialTypeStep.tsx` | Remover pergunta de dormitórios e imports não utilizados |
| `SellPropertyStatusStep.tsx` | Alterar texto da pergunta (1 linha) |

### Validação

A validação do step comercial (`validate: (data) => !!data.sell?.commercialType`) não será afetada, pois só verifica o tipo do imóvel comercial, não os dormitórios.

---

## Resumo Visual das Mudanças

```text
ANTES (Comercial):
┌────────────────────────────────┐
│ Qual tipo de imóvel comercial? │
│ [Prédio] [Galpão] [Sala] ...   │
├────────────────────────────────┤
│ Quantos dormitórios?           │  ← REMOVER
│ [1] [2] [3] [4+]               │  ← REMOVER
├────────────────────────────────┤
│ Quantos banheiros?             │
│ [1] [2] [3] [4+]               │
└────────────────────────────────┘

DEPOIS (Comercial):
┌────────────────────────────────┐
│ Qual tipo de imóvel comercial? │
│ [Prédio] [Galpão] [Sala] ...   │
├────────────────────────────────┤
│ Quantos banheiros?             │
│ [1] [2] [3] [4+]               │
└────────────────────────────────┘
```

