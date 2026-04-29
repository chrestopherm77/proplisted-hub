## Ajustes no Portal de Imóveis

### 1. Novo tipo de imóvel: "Área de Lazer"

Adicionar a opção **Área de Lazer** à lista global de tipos de imóvel, para que apareça no formulário "Novo Anúncio" (`/portal-imoveis/novo`) e em todos os filtros/labels do app que usam essa lista.

**Arquivo:** `src/lib/propertyUtils.ts`
- Acrescentar `{ value: 'AREA_DE_LAZER', label: 'Área de Lazer' }` em `PROPERTY_TYPES` (após "Chácara").

Como o `<Select>` em `NewProperty.tsx` e em `PortalImoveis.tsx` já mapeia `PROPERTY_TYPES`, e `getPropertyTypeLabel()` é usada nos cards para renderizar o rótulo, o novo tipo aparecerá automaticamente no formulário, nos filtros e nos cards sem mudanças adicionais.

### 2. Filtros completos no Portal de Imóveis (estilo Balcão de Parceria)

Hoje `src/pages/PortalImoveis.tsx` só tem: busca por texto, Tipo e Operação. Vamos expandir para o mesmo padrão do Balcão (`PropertySearches.tsx`):

**Novos filtros (em uma faixa de filtros responsiva):**
- Estado (UF) — `Select` carregado via `useIBGELocation`
- Cidade — `Select` carregado quando UF é escolhida (com opção "Todas")
- Tipo de imóvel — já existe (manter)
- Objetivo / Operação — já existe (manter, renomear label visual para "Objetivo")
- Zona — `Select` com `ZONE_OPTIONS` (Norte, Sul, Leste, Oeste, Centro, Rural)
- Valor mínimo — `Input` com máscara de moeda (`formatCurrencyInput` / `parseCurrencyInput`)
- Valor máximo — `Input` com máscara de moeda
- Busca por texto livre — manter (código, bairro, etc.)
- Botão **"Limpar filtros"** quando houver algum filtro ativo

**Lógica de filtragem (`useMemo` existente):**
- Estado: `p.state === filterState`
- Cidade: `p.city === filterCity`
- Zona: `p.zone === filterZone`
- Valor: comparar contra `p.price_sale` quando operação for SALE/BOTH, e `p.price_rent` quando for RENT; se não houver operação selecionada, usar `price_sale ?? price_rent`. Aplicar `>= min` e `<= max` quando preenchidos.

### Layout

Manter o card de filtros logo abaixo do header. Em telas grandes: grid de 4 colunas (UF | Cidade | Tipo | Objetivo) na primeira linha + (Zona | Valor mín | Valor máx | Busca) na segunda. Em mobile: empilhado.

### Arquivos a editar

- `src/lib/propertyUtils.ts` — adicionar "Área de Lazer" em `PROPERTY_TYPES`.
- `src/pages/PortalImoveis.tsx` — novos states de filtros, `useIBGELocation`, novos `Select`/`Input` no JSX, lógica adicional no `useMemo`, botão "Limpar filtros".

Sem mudanças no banco de dados (todas as colunas necessárias — `state`, `city`, `zone`, `price_sale`, `price_rent`, `property_type`, `operation_type` — já existem em `properties`).
