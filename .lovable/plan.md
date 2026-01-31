
## Plano: Seleção Hierárquica de Localização (Estado, Cidade, Bairro)

### Resumo

Implementar um sistema de seleção hierárquica de localização usando a API do IBGE que será utilizado em:
1. **Formulário de Leads (/lp)** - Todos os 4 fluxos (SELL, BUY, BUILD, RENT)
2. **Cadastro de Usuários** - Tanto para Pessoa Física (PF) quanto Pessoa Jurídica (PJ)

A estrutura será: **Estado (Select)** → **Cidade (Combobox com busca)** → **Bairro (Input livre)**

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                    LocationSelector Component                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Estado     │ →  │   Cidade     │ →  │   Bairro     │      │
│  │   (Select)   │    │  (Combobox)  │    │   (Input)    │      │
│  │  27 opções   │    │   Pesquisa   │    │    Livre     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         ↓                   ↓                   ↓               │
│    API IBGE            API IBGE           Digitação            │
│   /estados         /estados/{uf}/         Livre                │
│                       municipios                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Endpoints da API do IBGE

| Recurso | URL | Resposta |
|---------|-----|----------|
| Estados | `https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome` | `[{ id, sigla, nome }]` |
| Cidades | `https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios?orderBy=nome` | `[{ id, nome }]` |

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useIBGELocation.ts` | Hook para gerenciar estados e cidades da API IBGE |
| `src/components/leadform/LocationSelector.tsx` | Componente para o formulário de leads |
| `src/components/auth/LocationSelector.tsx` | Componente para o cadastro de usuários |

---

## Arquivos a Modificar

### Tipos e Dados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/leadform/types.ts` | Adicionar campos `uf`, `city`, `neighborhood` em cada FlowData |
| `src/types/signup.ts` | Adicionar campos `addressUf`, `addressCity`, `addressNeighborhood` |

### Formulário de Leads (/lp)

| Arquivo | Alteração |
|---------|-----------|
| `src/components/leadform/steps/sell/SellGeneralInfoStep.tsx` | Substituir input `region` pelo LocationSelector |
| `src/components/leadform/steps/buy/BuyLocationBudgetStep.tsx` | Substituir input `region` pelo LocationSelector |
| `src/components/leadform/steps/build/BuildLocationStep.tsx` | Substituir input `location` pelo LocationSelector |
| `src/components/leadform/steps/rent/RentLocationValueStep.tsx` | Substituir input `region` pelo LocationSelector |

### Cadastro de Usuários

| Arquivo | Alteração |
|---------|-----------|
| `src/components/auth/steps/PFGeneralDataStep.tsx` | Substituir input `address` pelo LocationSelector + complemento |
| `src/components/auth/steps/PJGeneralDataStep.tsx` | Substituir input `address` pelo LocationSelector + complemento |
| `src/components/auth/MultiStepSignup.tsx` | Atualizar validação para novos campos |

---

## Detalhes de Implementação

### 1. Hook `useIBGELocation.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';

interface IBGEState { id: number; sigla: string; nome: string; }
interface IBGECity { id: number; nome: string; }

const IBGE_API = 'https://servicodados.ibge.gov.br/api/v1/localidades';

export function useIBGELocation() {
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStates = useCallback(async () => {
    setLoadingStates(true);
    setError(null);
    try {
      const res = await fetch(`${IBGE_API}/estados?orderBy=nome`);
      if (!res.ok) throw new Error('Falha ao carregar estados');
      const data = await res.json();
      setStates(data);
    } catch (err) {
      setError('Erro ao carregar estados');
      console.error('Erro ao buscar estados:', err);
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const fetchCities = useCallback(async (uf: string) => {
    if (!uf) { setCities([]); return; }
    setLoadingCities(true);
    setError(null);
    try {
      const res = await fetch(`${IBGE_API}/estados/${uf}/municipios?orderBy=nome`);
      if (!res.ok) throw new Error('Falha ao carregar cidades');
      const data = await res.json();
      setCities(data);
    } catch (err) {
      setError('Erro ao carregar cidades');
      console.error('Erro ao buscar cidades:', err);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  // Carregar estados automaticamente
  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  return { 
    states, 
    cities, 
    loadingStates, 
    loadingCities, 
    error,
    fetchStates, 
    fetchCities 
  };
}
```

### 2. Componente LocationSelector (Lead Form)

Estrutura do componente:

```typescript
interface LocationSelectorProps {
  uf: string;
  city: string;
  neighborhood: string;
  onUFChange: (uf: string) => void;
  onCityChange: (city: string) => void;
  onNeighborhoodChange: (neighborhood: string) => void;
  showNeighborhood?: boolean; // Opcional, default true
}

// Layout:
// - Select para Estado (usa componente Select do shadcn)
// - Combobox para Cidade (usa Command + Popover para busca)
// - Input para Bairro (digitacao livre)
```

### 3. Atualizar Types

**Lead Form Types (`src/components/leadform/types.ts`):**

```typescript
// Adicionar em cada FlowData:
interface SellFlowData {
  // ... campos existentes ...
  region?: string;      // MANTER para compatibilidade
  uf?: string;          // NOVO
  city?: string;        // NOVO  
  neighborhood?: string; // NOVO
}

interface BuyFlowData {
  // ... campos existentes ...
  region?: string;      
  uf?: string;          
  city?: string;        
  neighborhood?: string; 
}

interface BuildFlowData {
  // ... campos existentes ...
  location?: string;    // MANTER para compatibilidade
  uf?: string;          
  city?: string;        
  neighborhood?: string; 
}

interface RentFlowData {
  // ... campos existentes ...
  region?: string;      
  uf?: string;          
  city?: string;        
  neighborhood?: string; 
}
```

**Signup Types (`src/types/signup.ts`):**

```typescript
export interface SignupFormData {
  // ... campos existentes ...
  address: string;         // MANTER para compatibilidade (logradouro + numero)
  addressUf: string;       // NOVO - Estado
  addressCity: string;     // NOVO - Cidade
  addressNeighborhood: string; // NOVO - Bairro
}
```

### 4. Atualizar Steps de Localização (Lead Form)

**Exemplo: SellGeneralInfoStep.tsx**

```typescript
import { LocationSelector } from "../LocationSelector";

export function SellGeneralInfoStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer title="Informações do imóvel" subtitle="...">
      <div className="space-y-6 max-w-md mx-auto">
        {/* Metragem */}
        <div className="space-y-2">
          <Label>Metragem (m²)</Label>
          <Input ... />
        </div>

        {/* Localização - NOVO */}
        <LocationSelector
          uf={data.sell?.uf || ''}
          city={data.sell?.city || ''}
          neighborhood={data.sell?.neighborhood || ''}
          onUFChange={(uf) => updateFlowData('sell', { uf, city: '', neighborhood: '' })}
          onCityChange={(city) => updateFlowData('sell', { city })}
          onNeighborhoodChange={(neighborhood) => updateFlowData('sell', { neighborhood })}
        />
      </div>
    </StepContainer>
  );
}
```

### 5. Atualizar Cadastro de Usuários

**Novo layout do campo Endereço:**

```text
┌──────────────────────────────────────────────────────────┐
│ Localização                                              │
├──────────────────┬───────────────────────────────────────┤
│ Estado (Select)  │ Cidade (Combobox com busca)          │
├──────────────────┴───────────────────────────────────────┤
│ Bairro (Input)                                           │
├──────────────────────────────────────────────────────────┤
│ Endereço (Rua, número, complemento)                      │
└──────────────────────────────────────────────────────────┘
```

O campo `address` atual passará a armazenar apenas logradouro, número e complemento.

### 6. Gerar `region` para Compatibilidade

Ao submeter, gerar automaticamente o campo `region` concatenando:

```typescript
// No LeadFormWizard, antes de submeter:
const generateRegion = (uf: string, city: string, neighborhood: string) => {
  if (!city || !uf) return '';
  return neighborhood 
    ? `${neighborhood} - ${city}/${uf}`
    : `${city}/${uf}`;
};

// Exemplo de saída: "Savassi - Belo Horizonte/MG"
```

---

## Fluxo de Uso

```text
1. Componente monta
   ↓
2. Hook carrega 27 estados da API do IBGE (ordenados por nome)
   ↓
3. Usuário seleciona Estado (ex: "Minas Gerais")
   ↓
4. Hook carrega cidades de MG (~850 cidades)
   ↓
5. Usuário digita no combobox para filtrar (ex: "Belo")
   ↓
6. Usuário seleciona cidade (ex: "Belo Horizonte")
   ↓
7. Usuário digita bairro livremente (ex: "Savassi")
   ↓
8. Dados armazenados:
   - uf: "MG"
   - city: "Belo Horizonte"
   - neighborhood: "Savassi"
   - region: "Savassi - Belo Horizonte/MG" (gerado automaticamente)
```

---

## Considerações de UX

| Aspecto | Implementação |
|---------|---------------|
| **Loading** | Skeleton/spinner enquanto carrega estados/cidades |
| **Fallback** | Se API falhar, mostrar mensagem e permitir digitação livre |
| **Ordem** | Estados e cidades ordenados alfabeticamente |
| **Busca** | Combobox de cidades permite filtrar digitando |
| **Reset** | Ao mudar estado, cidade e bairro são limpos |
| **Responsivo** | Layout em coluna no mobile |

---

## Compatibilidade

O campo `region`/`location` continuará sendo gerado automaticamente para manter compatibilidade com:

- Filtros do Marketplace (que usam `extractUF` e `extractCity`)
- Exibição de leads existentes no sistema
- Exportação de dados
- Dados históricos

---

## Resumo das Mudanças

| Local | Antes | Depois |
|-------|-------|--------|
| **Lead Form** | Input livre "Bairro, cidade ou região" | Estado (Select) + Cidade (Combobox) + Bairro (Input) |
| **Cadastro PF/PJ** | Input livre "Rua, número, bairro, cidade - UF" | Localização estruturada + Endereço (apenas logradouro) |
| **Armazenamento** | `region: "Savassi, Belo Horizonte - MG"` | `uf: "MG"`, `city: "Belo Horizonte"`, `neighborhood: "Savassi"`, `region: "Savassi - Belo Horizonte/MG"` |
