
## Plano: Reorganização dos Filtros do Marketplace e Remoção da Seção Duplicada

### Resumo
Duas alterações principais:
1. **Filtros do Marketplace**: Reorganizar para incluir UF, Cidade, Bairro, Objetivo (Comprar/Construir/Alugar/Vender) e Valor
2. **Modal de Detalhes do Lead**: Remover a seção duplicada "Todas as Respostas do Formulário"

---

### Parte 1: Reorganização dos Filtros do Marketplace

**Arquivo a modificar:** `src/pages/Leads.tsx`

#### 1.1 Análise dos Dados Disponíveis

Os leads armazenam os seguintes dados relevantes para filtragem no `form_data`:

| Campo | Localização no form_data | Exemplo |
|-------|-------------------------|---------|
| UF (Estado) | Extraído de `region` (ex: "MG", "betim/mg") | MG |
| Cidade | Extraído de `region` | Betim |
| Bairro | `sell.neighborhood`, `buy.neighborhood`, etc. | Centro |
| Objetivo | `intention` | SELL, BUY, BUILD, RENT |
| Valor | `sell.expectedValue`, `buy.budgetMax`, `rent.maxRent`, `build.budget` | R$ 250.000,00 |

#### 1.2 Novos Filtros a Implementar

Substituir os filtros atuais (Região e Interesse) por:

| Filtro | Tipo | Valores |
|--------|------|---------|
| **UF (Estado)** | Select | Extraído da região (ex: MG, SP, RJ) |
| **Cidade** | Select | Extraído da região (ex: Betim, São Paulo) |
| **Bairro** | Select | Se disponível no form_data |
| **Objetivo** | Select | Vender, Comprar, Construir, Alugar |
| **Valor** | Faixas | Até R$ 100k, R$ 100k-250k, R$ 250k-500k, R$ 500k-1M, Acima R$ 1M |

#### 1.3 Lógica de Extração de Dados

Criar funções helper para extrair UF/Cidade da região:

```text
Exemplo de região: "betim/mg" ou "MG" ou "Betim - MG"

extractUF("betim/mg") → "MG"
extractCity("betim/mg") → "Betim"
```

#### 1.4 Estados a Adicionar

```typescript
// Estados temporários (antes de clicar "Filtrar")
const [tempUF, setTempUF] = useState<string>('all');
const [tempCity, setTempCity] = useState<string>('all');
const [tempBairro, setTempBairro] = useState<string>('all');
const [tempObjective, setTempObjective] = useState<string>('all');
const [tempValueRange, setTempValueRange] = useState<string>('all');

// Estados aplicados
const [filterUF, setFilterUF] = useState<string>('all');
const [filterCity, setFilterCity] = useState<string>('all');
const [filterBairro, setFilterBairro] = useState<string>('all');
const [filterObjective, setFilterObjective] = useState<string>('all');
const [filterValueRange, setFilterValueRange] = useState<string>('all');
```

#### 1.5 Funções de Extração de Dados do form_data

```typescript
// Extrair UF do campo region
function extractUF(region: string | undefined): string {
  if (!region) return '';
  // Formatos: "MG", "betim/mg", "Betim - MG"
  const upper = region.toUpperCase();
  const match = upper.match(/\b([A-Z]{2})\b/);
  return match ? match[1] : '';
}

// Extrair cidade do campo region
function extractCity(region: string | undefined): string {
  if (!region) return '';
  // Formatos: "betim/mg" → "Betim", "Betim - MG" → "Betim"
  const parts = region.split(/[\/\-,]/);
  const city = parts[0].trim();
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

// Extrair objetivo do form_data
function extractObjective(formData: any): string {
  return formData?.intention || '';
}

// Extrair valor e converter para número
function extractValue(formData: any): number | null {
  const intention = formData?.intention;
  let valueStr = '';
  
  switch(intention) {
    case 'SELL':
      valueStr = formData?.sell?.expectedValue;
      break;
    case 'BUY':
      valueStr = formData?.buy?.budgetMax;
      break;
    case 'BUILD':
      valueStr = formData?.build?.budget;
      break;
    case 'RENT':
      valueStr = formData?.rent?.maxRent;
      break;
  }
  
  if (!valueStr) return null;
  // Parse "R$ 250.000,00" → 250000
  const numbers = valueStr.replace(/\D/g, '');
  return numbers ? parseInt(numbers, 10) / 100 : null;
}
```

#### 1.6 Faixas de Valor

```typescript
const valueRanges = [
  { value: 'all', label: 'Todos os valores' },
  { value: 'up_to_100k', label: 'Até R$ 100.000', min: 0, max: 100000 },
  { value: '100k_to_250k', label: 'R$ 100.000 - R$ 250.000', min: 100000, max: 250000 },
  { value: '250k_to_500k', label: 'R$ 250.000 - R$ 500.000', min: 250000, max: 500000 },
  { value: '500k_to_1m', label: 'R$ 500.000 - R$ 1.000.000', min: 500000, max: 1000000 },
  { value: 'above_1m', label: 'Acima de R$ 1.000.000', min: 1000000, max: Infinity },
];
```

#### 1.7 Labels de Objetivo em Português

```typescript
const objectiveLabels: Record<string, string> = {
  'SELL': 'Vender',
  'BUY': 'Comprar',
  'BUILD': 'Construir',
  'RENT': 'Alugar',
};
```

#### 1.8 Nova UI dos Filtros

Layout reorganizado com 5 filtros + botões:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Filtros                                                           │
├─────────────────────────────────────────────────────────────────────┤
│ UF        │ Cidade      │ Bairro      │ Objetivo    │ Valor         │
│ [Todos ▼] │ [Todas ▼]   │ [Todos ▼]   │ [Todos ▼]   │ [Todos ▼]     │
├─────────────────────────────────────────────────────────────────────┤
│                                          [Filtrar]  [Limpar]        │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Parte 2: Remover Seção Duplicada do Modal

**Arquivo a modificar:** `src/components/marketplace/LeadDetailsModal.tsx`

#### 2.1 Seção a Remover

Na linha 148-164, existe a seção "Todas as Respostas do Formulário" que duplica informações já apresentadas na seção "Detalhes do Lead":

```tsx
{/* Complete Form Data Section - SEMPRE MOSTRA TODOS OS CAMPOS */}
{completeSection && completeSection.fields.length > 0 && (
  <div className="mt-6 pt-4 border-t border-dashed">
    <h4>Todas as Respostas do Formulário</h4>
    ... campos duplicados ...
  </div>
)}
```

#### 2.2 Alteração

Remover completamente o bloco `completeSection` (linhas 148-164) e a variável `completeSection` (linha 94).

---

### Detalhes Técnicos

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Leads.tsx` | Reorganizar filtros (UF, Cidade, Bairro, Objetivo, Valor) |
| `src/components/marketplace/LeadDetailsModal.tsx` | Remover seção duplicada "Todas as Respostas do Formulário" |

#### Dependências dos Filtros

O filtro de **Cidade** será automaticamente filtrado com base no **UF** selecionado:
- Se UF = "MG" → Mostrar apenas cidades de MG
- Se UF = "Todos" → Mostrar todas as cidades

#### Ordem dos Filtros Aplicados

```text
1. Filtrar por UF (se selecionado)
2. Filtrar por Cidade (se selecionada)
3. Filtrar por Bairro (se selecionado)
4. Filtrar por Objetivo (se selecionado)
5. Filtrar por Faixa de Valor (se selecionada)
```

---

### Resultado Esperado

1. **Filtros reorganizados** com UF, Cidade, Bairro, Objetivo e Valor
2. **Dados extraídos corretamente** do form_data de cada lead
3. **Faixas de valor** pré-definidas para facilitar a busca
4. **Seção duplicada removida** do modal de detalhes do lead
5. **Melhor experiência** para compradores de leads encontrarem o que procuram
