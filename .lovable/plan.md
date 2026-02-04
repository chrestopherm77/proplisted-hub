

## Plano: Melhorar Email de Notificação e Traduzir Labels para Português

### Resumo

Este plano aborda três problemas identificados:

1. **Email muito simples** - Adicionar todas as informações do lead (igual ao modal "Detalhes do Lead") e mais cores/design
2. **Labels em inglês** - Traduzir valores como "30_days" para "Em até 30 dias" no card do lead e no email
3. **Placeholders incorretos** - Alterar exemplos de valores de 200k-500k para 100k-10M

---

## Problema 1: Email Muito Simples

### Causa
A Edge Function `notify-new-lead` usa uma função `extractCharacteristics` muito básica que só extrai ~6 campos:
- Tipo de imóvel
- Quartos/Banheiros
- Tamanho
- Valor/Orçamento
- Finalidade
- Prazo

Mas o sistema já tem toda a lógica completa no arquivo `formatFormData.ts` que extrai TODOS os campos organizados em seções!

### Solução

Reescrever a Edge Function para:
1. Usar a mesma lógica de extração de dados do `formatFormData.ts`
2. Gerar HTML mais colorido e organizado
3. Incluir todas as seções: Intenção, Preferências, Localização, Pagamento, Prazo, etc.

### Novo Design do Email

```text
┌─────────────────────────────────────────────────────────────┐
│           🏠 LeadBay (logo em verde teal)                   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🎉 Novo lead na sua região!                          │  │
│  │  📍 Belo Horizonte/MG (badge colorido)                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Interesse: Comprar imóvel                             │  │
│  │  (card com background teal claro)                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🎯 Intenção                                          │  │
│  │  Finalidade: Moradia                                   │  │
│  │  Tipo: Casa                                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🏠 Preferências                                      │  │
│  │  Dormitórios: 3                                        │  │
│  │  Banheiros: 2                                          │  │
│  │  Vagas: 2                                              │  │
│  │  Status: Pronto para morar                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  💰 Orçamento                                          │  │
│  │  Mínimo: R$ 300.000,00                                 │  │
│  │  Máximo: R$ 500.000,00                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  💳 Pagamento                                          │  │
│  │  Forma: Financiamento                                  │  │
│  │  Financiamento aprovado: Sim                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ⏰ Prazo                                              │  │
│  │  Prazo: Em até 30 dias                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│           [ Ver Lead → ] (botão verde)                       │
│                                                              │
│  ⚠️ Não inclui: Nome, telefone, email do lead               │
└─────────────────────────────────────────────────────────────┘
```

---

## Problema 2: Labels em Inglês ("30_days")

### Causa
O campo `deadline` no email está mostrando o valor bruto (ex: `30_days`) porque a Edge Function não tem as mesmas traduções que existem em `formatFormData.ts`.

### Solução
Adicionar todos os mapeamentos de labels na Edge Function, incluindo:

| Campo | Valor Bruto | Tradução |
|-------|-------------|----------|
| deadline | `30_days` | "Em até 30 dias" |
| deadline | `1_to_3_months` | "De 1 a 3 meses" |
| deadline | `3_to_6_months` | "De 3 a 6 meses" |
| deadline | `up_to_1_year` | "Até 1 ano" |
| moveInDeadline | `IMMEDIATE` | "Imediato" |
| etc. | ... | ... |

---

## Problema 3: Placeholders de Valores

### Localização
`src/components/leadform/steps/buy/BuyLocationBudgetStep.tsx`

### Alteração
| Campo | Antes | Depois |
|-------|-------|--------|
| Valor mínimo | `R$ 200.000,00` | `R$ 100.000,00` |
| Valor máximo | `R$ 500.000,00` | `R$ 10.000.000,00` |

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/notify-new-lead/index.ts` | Reescrever para incluir todos os dados e melhorar design do HTML |
| `src/components/leadform/steps/buy/BuyLocationBudgetStep.tsx` | Alterar placeholders de valores |

---

## Detalhes Técnicos

### Edge Function: Mapeamentos Completos

Adicionar todos os labels à Edge Function:

```typescript
// Todos os mapeamentos necessários
const deadlineLabels: Record<string, string> = {
  '30_days': 'Em até 30 dias',
  '1_to_3_months': 'De 1 a 3 meses',
  '3_to_6_months': 'De 3 a 6 meses',
  'up_to_1_year': 'Até 1 ano',
  'IMMEDIATE': 'Imediato',
  'UP_TO_1_MONTH': 'Até 1 mês',
  'UP_TO_3_MONTHS': 'Até 3 meses',
  '1_TO_3_MONTHS': '1 a 3 meses',
  '3_TO_6_MONTHS': '3 a 6 meses',
  '6_TO_12_MONTHS': '6 a 12 meses',
  'OVER_12_MONTHS': 'Mais de 12 meses',
  'NO_RUSH': 'Sem pressa',
  'FLEXIBLE': 'Flexível',
};

const propertyReadyStatusLabels: Record<string, string> = {
  'READY': 'Pronto para morar',
  'UNDER_CONSTRUCTION': 'Em construção',
  'BOTH': 'Pronto ou em construção',
};

// + todos os outros mapeamentos existentes em formatFormData.ts
```

### Edge Function: Estrutura de Seções

Organizar os dados em seções igual ao modal:

```typescript
interface EmailSection {
  icon: string;
  title: string;
  fields: { label: string; value: string }[];
}

function extractAllCharacteristics(formData: Record<string, any>): EmailSection[] {
  const sections: EmailSection[] = [];
  const intention = formData.intention;
  const flowData = formData[intention?.toLowerCase()] || {};
  
  // Seção: Intenção
  const intentSection: EmailSection = { icon: '🎯', title: 'Intenção', fields: [] };
  if (flowData.purpose) {
    intentSection.fields.push({ 
      label: 'Finalidade', 
      value: purposeLabels[flowData.purpose] || flowData.purpose 
    });
  }
  if (flowData.propertyType) {
    intentSection.fields.push({ 
      label: 'Tipo', 
      value: propertyTypeLabels[flowData.propertyType] || flowData.propertyType 
    });
  }
  if (intentSection.fields.length > 0) sections.push(intentSection);
  
  // Seção: Preferências
  // Seção: Localização e Orçamento
  // Seção: Pagamento
  // Seção: Prazo
  // ... etc
  
  return sections;
}
```

### Edge Function: HTML Colorido

Usar cores do tema LeadBay:

```typescript
// Cores
const colors = {
  primary: '#0d9488',      // Teal (verde principal)
  primaryLight: '#f0fdfa', // Teal claro (backgrounds)
  text: '#18181b',         // Texto escuro
  muted: '#71717a',        // Texto secundário
  border: '#e4e4e7',       // Bordas
  white: '#ffffff',
  background: '#f4f4f5',   // Fundo geral
};
```

---

## Resumo das Alterações

1. **Edge Function `notify-new-lead`**:
   - Adicionar todos os mapeamentos de labels (deadline, purpose, propertyType, etc.)
   - Criar função que extrai dados organizados em seções
   - Gerar HTML com cards coloridos para cada seção
   - Incluir todas as informações do formulário

2. **BuyLocationBudgetStep**:
   - Placeholder mínimo: `R$ 100.000,00`
   - Placeholder máximo: `R$ 10.000.000,00`

