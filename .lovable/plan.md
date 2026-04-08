

# Plano: Título do Imóvel, Formatação de Valor e Filtros

## Mudanças

### 1. Migration SQL
- Adicionar coluna `title` (text, nullable) na tabela `property_searches`

### 2. `NewPropertySearch.tsx` — Campo "Título do Imóvel"
- Adicionar campo de texto "Título do Imóvel" no formulário de todos os 6 tipos, como primeiro campo do formulário
- Salvar no insert como `title`

### 3. `PropertySearches.tsx` — Reformular listagem
- **Título**: onde hoje mostra "Casa" / "Apartamento" como texto principal, passa a mostrar o `title` do imóvel (ou fallback para o tipo se não tiver título)
- **Tipo como tag colorida**: o tipo de imóvel (Casa, Apartamento, etc.) vira uma Badge com cor específica por tipo:
  - Casa → azul
  - Apartamento → roxo
  - Sala Comercial → laranja
  - Lote → amarelo
  - Rural → verde
  - Prédio Comercial → vermelho
- **Valor formatado**: exibir com "R$" e separadores de milhar (já está parcialmente, garantir formatação consistente)
- **Filtros estruturados**: adicionar selects de filtro por Cidade, Estado e Tipo de Imóvel (extraídos dos dados carregados), além do campo de busca texto existente

### 4. `PropertySearchDetail.tsx`
- Exibir o título no cabeçalho do detalhe
- Incluir `title` na interface

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `ALTER TABLE property_searches ADD COLUMN title text` |
| `src/pages/NewPropertySearch.tsx` | Campo "Título do Imóvel" no formulário |
| `src/pages/PropertySearches.tsx` | Título na lista, tipo como badge colorida, valor formatado, filtros por cidade/estado/tipo |
| `src/pages/PropertySearchDetail.tsx` | Exibir título no cabeçalho |

