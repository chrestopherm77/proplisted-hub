

## Ajustes no Portal de Imóveis

### 1. Labels de valores no formulário
Em `src/pages/NewProperty.tsx`:
- Trocar label `Condomínio` → **`Condomínio (Mensal)`**
- Trocar label `IPTU` → **`IPTU (Anual)`**

(somente os textos visuais; campos `condoFee` e `iptu` continuam iguais no banco)

### 2. Limite de fotos: 20 → 30
- `src/pages/NewProperty.tsx`: alterar `<PropertyPhotosUpload max={20} />` para `max={30}`.
- `src/components/portal/PropertyPhotosUpload.tsx`: alterar default `max = 20` → `max = 30`.

### 3. Filtros sobrepostos pelo mapa
Em `src/pages/PortalImoveis.tsx`, quando o modo `map` está ativo, o `<Card>` do mapa (com `z-index` interno do Leaflet bem alto, ~400+) fica acima dos `SelectContent` dos filtros, fazendo o dropdown sumir atrás dele.

Correção: forçar o popper dos filtros (Radix Select) a ficar acima do mapa. Duas mudanças mínimas:

- Nos três `<Select>` da página (Tipo, Operação) e qualquer outro filtro, passar `className="z-[1100]"` no `<SelectContent>` para sobrepor o Leaflet.
- Garantir que o container do `<MapContainer>` em `PropertyMap.tsx` use `z-index` baixo no wrapper (`relative z-0`) para não competir com popovers.

Resultado: ao abrir os filtros no modo mapa, as opções aparecem por cima do mapa normalmente, sem precisar empurrar o mapa para baixo.

### Arquivos afetados
- `src/pages/NewProperty.tsx` — labels + `max={30}`
- `src/components/portal/PropertyPhotosUpload.tsx` — default `max = 30`
- `src/pages/PortalImoveis.tsx` — `z-[1100]` nos `SelectContent` dos filtros
- `src/components/portal/PropertyMap.tsx` — wrapper com `relative z-0`

### O que não muda
- Schema do banco, RLS, fluxo de upload, geocoding, cards, página de detalhes.

