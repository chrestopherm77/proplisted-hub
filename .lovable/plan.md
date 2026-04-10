

# Plano: Efeito de mapa-múndi no cabeçalho da página "Buscar Oferta"

## Resumo
Adicionar um fundo com efeito de mapa-múndi (estilo sutil, azul claro com linhas de mapa) atrás do cabeçalho da página PropertySearches, similar à imagem de referência.

## Implementação

### 1. Criar imagem SVG de mapa-múndi
- Usar um SVG inline simplificado com contornos de continentes em tom azul claro/transparente
- Salvar como `public/images/world-map-bg.svg`

### 2. `src/pages/PropertySearches.tsx` — Adicionar fundo no header
- Envolver o bloco do título + subtítulo + botão "Nova Procura" em uma `div` com:
  - Background azul claro (`bg-primary-light` ou similar)
  - Imagem do mapa como `background-image` com opacidade baixa
  - Bordas arredondadas, padding generoso
  - O texto e botão ficam por cima do fundo do mapa

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `public/images/world-map-bg.svg` | **Novo** — SVG do mapa-múndi |
| `src/pages/PropertySearches.tsx` | Wrapper com fundo de mapa no header |

