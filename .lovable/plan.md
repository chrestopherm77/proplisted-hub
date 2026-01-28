

## Plano: Ajustes no Fluxo de Construir Imóvel

### Resumo

Realizar 2 ajustes no fluxo "Construir um imóvel":

1. Substituir "conhecimento" por "construtor" na pergunta sobre quem vai executar a obra
2. Otimizar o fluxo BTS para evitar pergunta duplicada

---

## Alterações a Realizar

### 1. Substituir "conhecimento" por "construtor"

**Arquivo:** `src/components/leadform/steps/build/BuildKnowledgeStep.tsx`

| Campo | Atual | Novo |
|-------|-------|------|
| Título (linha 14) | "Você já possui conhecimento definido para executar a obra?" | "Você já possui construtor definido para executar a obra?" |
| Subtítulo (linha 15) | "Conhece o processo de construção?" | "Já tem uma construtora ou engenheiro responsável?" |

---

### 2. Otimizar Fluxo BTS (Evitar Pergunta Duplicada)

**Problema:** Se o usuário seleciona "Gostaria de fazer um Built to Suit (BTS)" na etapa 3 (BuildLandStep), lá na etapa 8 o sistema pergunta novamente "É BTS?".

**Solução:** 
- Se `hasLand === 'BTS_INTEREST'`, pular o `BuildBTSConfirmStep` e ir direto para o `BuildBTSStep`
- Se `hasLand !== 'BTS_INTEREST'`, mostrar o `BuildBTSConfirmStep` normalmente

**Arquivo:** `src/components/leadform/LeadFormWizard.tsx`

**Alterações nas regras de visibilidade:**

```text
ANTES:
┌─────────────────────────────────────────────────────────────┐
│ build-bts-confirm                                           │
│   isVisible: data.intention === 'BUILD'                     │
│   (sempre visível no fluxo BUILD)                           │
├─────────────────────────────────────────────────────────────┤
│ build-bts                                                   │
│   isVisible: data.build?.isBTSConfirmed === true            │
│   (só mostra se confirmou BTS)                              │
└─────────────────────────────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────────────────────────────┐
│ build-bts-confirm                                           │
│   isVisible: data.intention === 'BUILD' &&                  │
│              data.build?.hasLand !== 'BTS_INTEREST'         │
│   (só mostra se NÃO selecionou BTS_INTEREST na etapa 3)     │
├─────────────────────────────────────────────────────────────┤
│ build-bts                                                   │
│   isVisible: data.build?.isBTSConfirmed === true ||         │
│              data.build?.hasLand === 'BTS_INTEREST'         │
│   (mostra se confirmou OU se já escolheu BTS antes)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxo Visual Após Alteração

```text
                    BuildLandStep
                    "Já possui terreno?"
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
    [SIM]           [EM NEGOCIAÇÃO]     [BTS_INTEREST]
    [NÃO]                 │                   │
      │                   │                   │
      ▼                   ▼                   ▼
   (fluxo              (fluxo         ┌──────────────┐
   normal)             normal)        │  PULA etapa  │
      │                   │           │  "É BTS?"    │
      │                   │           └──────┬───────┘
      ▼                   ▼                  │
BuildBTSConfirmStep  BuildBTSConfirmStep     │
   "É BTS?"             "É BTS?"             │
      │                   │                  │
   [SIM]──────────────────┼──────────────────┤
      │                   │                  │
      ▼                   ▼                  ▼
         BuildBTSStep (Detalhes do BTS)
           - Faixa de aluguel
           - Prazo mínimo de contrato
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `BuildKnowledgeStep.tsx` | Alterar texto de "conhecimento" para "construtor" |
| `LeadFormWizard.tsx` | Ajustar condições de visibilidade para BTS |

---

## Detalhes Técnicos

### BuildKnowledgeStep.tsx - Linhas 13-16

```tsx
// ANTES
<StepContainer
  title="Você já possui conhecimento definido para executar a obra?"
  subtitle="Conhece o processo de construção?"
>

// DEPOIS
<StepContainer
  title="Você já possui construtor definido para executar a obra?"
  subtitle="Já tem uma construtora ou engenheiro responsável?"
>
```

### LeadFormWizard.tsx - Linhas 283-294

```tsx
// ANTES
{ 
  id: 'build-bts-confirm', 
  component: BuildBTSConfirmStep, 
  isVisible: (data) => data.intention === 'BUILD',
  validate: (data) => data.build?.isBTSConfirmed !== undefined,
},
{ 
  id: 'build-bts', 
  component: BuildBTSStep, 
  isVisible: (data) => data.intention === 'BUILD' && data.build?.isBTSConfirmed === true,
  validate: (data) => !!data.build?.btsRentRange && !!data.build?.btsMinContractTerm,
},

// DEPOIS
{ 
  id: 'build-bts-confirm', 
  component: BuildBTSConfirmStep, 
  // Só mostra se NÃO escolheu BTS_INTEREST na etapa do terreno
  isVisible: (data) => data.intention === 'BUILD' && data.build?.hasLand !== 'BTS_INTEREST',
  validate: (data) => data.build?.isBTSConfirmed !== undefined,
},
{ 
  id: 'build-bts', 
  component: BuildBTSStep, 
  // Mostra se confirmou BTS OU se já escolheu BTS_INTEREST antes
  isVisible: (data) => data.intention === 'BUILD' && (data.build?.isBTSConfirmed === true || data.build?.hasLand === 'BTS_INTEREST'),
  validate: (data) => !!data.build?.btsRentRange && !!data.build?.btsMinContractTerm,
},
```

---

## Validação

A validação do step `build-bts-confirm` não será afetada porque:
- Se `hasLand === 'BTS_INTEREST'`, o step é pulado (não precisa validar)
- Se `hasLand !== 'BTS_INTEREST'`, o step aparece e exige `isBTSConfirmed`

O step `build-bts` continua funcionando porque:
- Aparece quando `isBTSConfirmed === true` (fluxo normal)
- OU quando `hasLand === 'BTS_INTEREST'` (atalho direto)

