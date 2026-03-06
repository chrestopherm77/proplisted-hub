

## Traduzir todos os valores em inglês para português no formatFormData.ts

O problema está no arquivo `src/lib/formatFormData.ts` — vários valores usados no fluxo de aluguel (e alguns de outros fluxos) não possuem tradução nos mapas de labels. Isso faz com que valores brutos como `COMMERCIAL_BUILDING`, `immediately`, `OFFICE` apareçam no painel de rastreamento e nos modais de detalhes.

### Valores faltando e onde adicionar

**1. `propertyTypeLabels`** — adicionar valores do fluxo de aluguel:
- `COMMERCIAL_BUILDING` → `Prédio comercial`
- `OFFICE` → `Sala comercial`
- `STORE` → `Loja`
- `WAREHOUSE` → `Galpão`
- `EVALUATING` → `Avaliando opções`
- `MULTIPLE` → `Múltiplos tipos`

**2. `moveInDeadlineLabels`** — adicionar valores do `RentGuaranteeStep`:
- `immediately` → `Imediatamente`
- `up_to_30_days` → `Até 30 dias`
- `1_to_3_months` → (já existe)
- `more_than_3_months` → `Mais de 3 meses`

**3. `guaranteeLabels`** — adicionar variantes do `RentGuaranteeStep`:
- `capitalization` → `Título de capitalização`
- `unknown` → `Ainda não sei`

**4. `commercialTypeLabels`** — adicionar:
- `COMMERCIAL_BUILDING` → `Prédio comercial`
- `OFFICE` → `Sala comercial`

**5. `allLabelMaps`** — garantir que `propertyType` referencia o mapa atualizado

### Arquivo alterado
- `src/lib/formatFormData.ts` — apenas adicionar entradas nos mapas de tradução existentes

