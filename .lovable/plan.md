## Mudanças no `/corretor` (`src/pages/ConectaEImobPortal.tsx`)

### 1. Header — renomear CTA
- Trocar texto do botão `Anunciar Grátis` por `Buscar imóvel`.
- Manter destino atual em `/lp` (atualizar de `/lp-01` → `/lp` conforme escolhido).
- Os botões "Buscar Imóveis" (hero) e "Buscar agora" (banner vermelho) continuam indo para `/portal-imoveis` — sem alteração.

### 2. Seção Blog — virar carrossel clicável
Substituir o `grid` atual de 4 cards estáticos por um carrossel usando o componente `@/components/ui/carousel` (embla) já existente:
- Auto-play a cada ~5s (plugin `embla-carousel-autoplay`, instalar via `bun add embla-carousel-autoplay`).
- Setas de navegação (`CarouselPrevious` / `CarouselNext`) e dots customizados abaixo.
- Cada card vira `<Link to="/conectaeimob/noticias">` (a página de notícias hoje não tem rota de detalhe individual; manter o clique levando para a listagem completa, com âncora no topo).
- Buscar mais notícias no `useEffect` (limit 8 em vez de 4) para o carrossel ter conteúdo.
- Em desktop mostrar 3 cards por slide, tablet 2, mobile 1 (via `basis-full sm:basis-1/2 lg:basis-1/3`).
- Pausa o auto-play no hover (opção `stopOnInteraction: true`).

### 3. Página de Notícias (`src/pages/ConectaEImobNews.tsx`) — sidebar lateral
Hoje a página é uma coluna única `max-w-2xl`. Reorganizar em layout 2 colunas em telas md+:
- Coluna principal (≈8/12): lista de notícias atual, sem alterar a lógica.
- Coluna lateral (≈4/12, sticky `top-20`): adicionar 2 cards.

**Card 1 — CTA Cadastro/LP**
- Fundo gradient `--portal-cta-red` → `--portal-cta-red-hover`, texto branco.
- Título: "Encontre o imóvel ideal".
- Subtítulo curto.
- Botão "Buscar agora" → `/lp`.

**Card 2 — Indicadores do Mercado**
- Card branco com borda + título "Indicadores do Mercado".
- Lista estática (hardcoded por enquanto) de 4 indicadores:
  - Selic, IPCA (12m), IGP-M (12m), CUB/m² médio.
- Cada linha: nome do indicador + valor em destaque + variação (seta verde/vermelha).
- Rodapé pequeno: "Atualizado em jun/2026" (texto estático, fácil de editar manualmente).

Mobile: a sidebar aparece abaixo da lista (stack natural com `grid` responsivo).

## Resumo de arquivos

- **edit** `src/pages/ConectaEImobPortal.tsx` — renomear CTA, mudar destino para `/lp`, refatorar `BlogSection` para carrossel autoplay com cards clicáveis, aumentar `limit` da query de notícias para 8.
- **edit** `src/pages/ConectaEImobNews.tsx` — wrapper grid 2 colunas + componentes `CtaCard` e `MarketIndicatorsCard` inline.
- **dep** adicionar `embla-carousel-autoplay`.

Sem mudanças de banco, edge functions ou lógica de negócio.