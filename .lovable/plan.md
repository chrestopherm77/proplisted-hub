

# Plano: Expandir fundo do mapa para cobrir toda a área superior da página

## Problema
Atualmente o background do mapa (`map-bg.png`) cobre apenas a `<section>` do header e filtros (linhas 264-324). A área dos cards e sidebar (linha 326+) fica sem o fundo. O usuário quer que a imagem cubra **tudo** — desde o topo até o final dos cards.

## Solução
Mover o background do mapa para um wrapper que englobe tanto o header/filtros quanto o grid de cards/sidebar. Remover o `<section>` atual com background e colocar o fundo no container pai (`max-w-7xl`), usando a imagem como fundo de toda a página.

### `src/pages/PropertySearches.tsx`
1. Substituir a imagem `map-bg.png` pela nova imagem enviada pelo usuário (`ChatGPT_Image_10_de_abr._de_2026_11_36_30-2.png`) — salvar como `public/images/map-bg.png` (sobrescrever)
2. Remover o wrapper `<section>` com background do header (linhas 264-324) e mover o conteúdo para dentro do container principal
3. Aplicar o background do mapa no `<div className="max-w-7xl">` ou num wrapper full-width dentro do `<Layout>`, cobrindo header + filtros + grid de cards + sidebar
4. O background terá opacidade sutil, sem atrapalhar leitura dos cards

### `public/images/map-bg.png`
- Substituir pelo novo arquivo enviado pelo usuário

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `public/images/map-bg.png` | Substituir pela nova imagem |
| `src/pages/PropertySearches.tsx` | Expandir background para cobrir toda a área |

