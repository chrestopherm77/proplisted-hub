

## Traducao de labels e ajuste de max_purchases

### Problema 1: Nomes em ingles no modal
Campos como `city`, `neighborhood`, `uf`, `street` nao estao no mapeamento `fieldNameLabels` em `src/lib/formatFormData.ts`. Quando aparecem na secao "Outras Informacoes" (fallback), o codigo converte camelCase para texto legivel mas mantem em ingles.

### Problema 2: Quantidade maxima de vendas
Atualmente o `max_purchases` esta configurado como 3 em varios lugares. Precisa ser alterado para 5.

### Alteracoes

| Arquivo | O que muda |
|---|---|
| `src/lib/formatFormData.ts` | Adicionar traducoes para `city`, `neighborhood`, `uf`, `street`, `number`, `complement`, `zipCode` e outros campos de localizacao no `fieldNameLabels` |
| `src/components/leadform/LeadFormWizard.tsx` | Alterar `max_purchases: 3` para `max_purchases: 5` (linha 454) |
| `src/components/admin/LeadsManagement.tsx` | Alterar valor padrao de `max_purchases` de `'3'` para `'5'` (linhas 37, 105, 198) |
| `src/components/admin/CsvImport.tsx` | Alterar fallback de `max_purchases` de `3` para `5` (linhas 120, 152) |

### Detalhes tecnicos

**1. Novas entradas em `fieldNameLabels`** (src/lib/formatFormData.ts):

```text
city: 'Cidade',
neighborhood: 'Bairro',
uf: 'UF',
street: 'Rua',
number: 'Numero',
complement: 'Complemento',
zipCode: 'CEP',
cep: 'CEP',
state: 'Estado',
country: 'Pais',
address: 'Endereco',
```

**2. max_purchases default de 3 para 5** em:
- `LeadFormWizard.tsx` linha 454: `max_purchases: 5`
- `LeadsManagement.tsx` linhas 37, 105, 198: valor padrao `'5'`
- `CsvImport.tsx` linhas 120, 152: fallback `5`

