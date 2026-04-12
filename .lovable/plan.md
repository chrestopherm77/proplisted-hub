

# Plano: Renomear e adicionar filtros à página "Balcão de Parcerias"

## Mudanças de texto

| De | Para |
|---|---|
| Menu "Buscar oferta" | **Balcão de Parcerias** |
| Título "Buscar Oferta" | **Mural de Demandas** |
| Subtítulo | **Encontre compradores com o perfil exato dos seus imóveis e feche parcerias agora.** |
| Botão "Nova Procura" | **Interesse do Comprador** |

## Novos filtros

Adicionar na grade de filtros existente (que já tem Estado, Cidade e Tipo):
- **Objetivo** — Select: Comprar / Alugar (mapeia para `operation_type` COMPRA/VENDA e ALUGUEL)
- **Bairro** — Input texto livre (filtra por `neighborhood`)
- **Zona** — Input texto livre (filtra por `zone`)
- **Preço mínimo / máximo** — Dois inputs de valor (R$), filtrando pelo campo `value`
- **Modalidade** — Select: Novo / Usado (filtro local, sem coluna no banco por enquanto — filtra pelo texto do `observation` ou `headline`)

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/Layout.tsx` | Texto do link: "Balcão de Parcerias" |
| `src/components/MobileMenu.tsx` | Texto do link: "Balcão de Parcerias" |
| `src/pages/PropertySearches.tsx` | Título, subtítulo, botão + 5 novos filtros + lógica de filtragem |

