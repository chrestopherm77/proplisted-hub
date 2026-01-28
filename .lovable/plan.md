
## Plano: Modal de Detalhes na Página "Meus Leads"

### Resumo

Implementar um modal na página "Meus Leads" que exibe os dados completos do lead comprado, incluindo informações de contato (nome, telefone) e todos os dados do formulário com formatação adequada (R$ para valores monetários e m² para medidas).

---

## Problema Atual

1. A página `MyLeads.tsx` não busca o campo `form_data` da tabela `leads`
2. Não existe modal para visualizar detalhes completos do lead comprado
3. Apenas a descrição resumida é exibida no card

---

## Solução

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/marketplace/PurchasedLeadModal.tsx` | Modal específico para leads comprados que mostra dados de contato + form_data formatado |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/MyLeads.tsx` | Adicionar busca de form_data, estado do modal e integração |
| `src/lib/formatFormData.ts` | Adicionar função de formatação que adiciona m² e R$ automaticamente |

---

## Detalhes da Implementação

### 1. Novo Modal: PurchasedLeadModal.tsx

**Estrutura visual:**

```text
┌─────────────────────────────────────────────┐
│  Lead: João Silva                    [Pago] │
│  📞 (31) 99999-9999                         │
│  📧 joao@email.com (se disponível)          │
├─────────────────────────────────────────────┤
│                                             │
│  📋 Detalhes do Lead                        │
│                                             │
│  🎯 Intenção                                │
│     Finalidade: Moradia                     │
│     Tipo: Casa                              │
│                                             │
│  🏠 Preferências                            │
│     Dormitórios: 3                          │
│     Banheiros: 2                            │
│     Vagas: 2                                │
│     Área mínima: 150 m²                     │
│                                             │
│  📍 Localização e Orçamento                 │
│     Região: Betim - MG                      │
│     Orçamento: R$ 300.000,00 - R$ 500.000,00│
│                                             │
│  💳 Pagamento                               │
│     Forma: Financiamento                    │
│     Aprovado: Sim                           │
│                                             │
├─────────────────────────────────────────────┤
│  Comprado em: 28/01/2026                    │
│  Valor pago: R$ 15,00                       │
└─────────────────────────────────────────────┘
```

**Características:**
- Usa o mesmo sistema de seções do `LeadDetailsModal`
- Mostra nome e telefone no header (informações liberadas após compra)
- Exibe email se disponível
- Formata valores monetários com R$
- Formata medidas com m²
- Mostra data da compra e valor pago

---

### 2. Modificações no MyLeads.tsx

**Query atualizada:**
```typescript
.select(`
  id,
  amount,
  purchased_at,
  leads (
    id,
    name,
    phone,
    description,
    form_data    // ← NOVO
  )
`)
```

**Novos estados:**
```typescript
const [selectedPurchase, setSelectedPurchase] = useState<PurchasedLead | null>(null);
const [modalOpen, setModalOpen] = useState(false);
```

**Comportamento:**
- Ao clicar no card, abre o modal com detalhes completos
- Card permanece clicável (cursor-pointer, hover effect)

---

### 3. Melhorias no formatFormData.ts

**Nova função de formatação inteligente:**

```typescript
function formatValueWithUnits(key: string, value: any): string {
  // Campos de área/tamanho → adiciona m²
  const areaFields = ['size', 'minSize', 'landMinSize', 'area'];
  if (areaFields.includes(key)) {
    const numValue = String(value).replace(/[^\d.,]/g, '');
    if (numValue) return `${numValue} m²`;
  }
  
  // Campos monetários → garante R$
  const moneyFields = ['expectedValue', 'budget', 'budgetMin', 'budgetMax', 
                       'maxRent', 'tradeOfferValue'];
  if (moneyFields.includes(key)) {
    const strValue = String(value);
    // Se já tem R$, retorna como está
    if (strValue.includes('R$')) return strValue;
    // Se é número puro, formata
    return `R$ ${strValue}`;
  }
  
  return String(value);
}
```

**Campos afetados:**

| Campo | Unidade | Exemplo |
|-------|---------|---------|
| size | m² | 150 m² |
| minSize | m² | 80 m² |
| landMinSize | m² | 300 m² |
| area | m² | 200 m² |
| expectedValue | R$ | R$ 250.000,00 |
| budget | R$ | R$ 300.000,00 |
| budgetMin | R$ | R$ 200.000,00 |
| budgetMax | R$ | R$ 500.000,00 |
| maxRent | R$ | R$ 2.000,00 |
| tradeOfferValue | R$ | R$ 150.000,00 |

---

## Interface do PurchasedLeadModal

### Props

```typescript
interface PurchasedLeadModalProps {
  purchase: {
    id: string;
    amount: number;
    purchased_at: string;
    lead: {
      id: string;
      name: string;
      phone: string;
      description: string;
      form_data?: any;
    };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Diferenças do LeadDetailsModal

| Aspecto | LeadDetailsModal (Marketplace) | PurchasedLeadModal (Meus Leads) |
|---------|-------------------------------|--------------------------------|
| Header | Lead #ID | Nome completo |
| Contato | Oculto | Telefone + Email visíveis |
| Botões | Adicionar/Remover carrinho | Nenhum (já comprou) |
| Footer | Preço do lead | Data compra + Valor pago |
| Badge | X disponíveis | Pago |

---

## Fluxo de Uso

1. Usuário acessa `/my-leads`
2. Vê cards resumidos dos leads comprados
3. Clica em um card
4. Modal abre com:
   - Nome e telefone do lead (visível)
   - Seções organizadas do form_data
   - Valores formatados (R$, m²)
   - Data da compra e valor pago
5. Fecha o modal clicando fora ou no X

---

## Detalhes Técnicos

### Reuso de Código

O modal vai reutilizar:
- `formatFormDataToSections()` do formatFormData.ts
- Componentes de UI existentes (Dialog, ScrollArea, Badge)
- Mesma estrutura visual do LeadDetailsModal

### Formatação de Unidades

A lógica de formatação será adicionada na função `formatValue()` existente no formatFormData.ts, garantindo que:
- Campos de área sempre mostrem "m²" no final
- Campos monetários sempre tenham "R$" no início
- Não duplique símbolos se já existirem

---

## Resumo das Alterações

| Tipo | Arquivo | Descrição |
|------|---------|-----------|
| Criar | `PurchasedLeadModal.tsx` | Modal de detalhes para leads comprados |
| Modificar | `MyLeads.tsx` | Buscar form_data + integrar modal |
| Modificar | `formatFormData.ts` | Adicionar formatação com m² e R$ |
