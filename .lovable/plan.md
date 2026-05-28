# Página /conectaeimob — Portal público estilo "ConectaEImob"

Replicar fielmente o layout do HTML enviado (5 prints), trocando a paleta para as cores oficiais da Conectae. Página React standalone (sem Layout do app), rota pública, com dados reais de imóveis e notícias.

## Rota e arquivo

- Nova rota pública em `src/App.tsx`: `/conectaeimob` → `<ConectaEImobPortal />`.
- Adicionar `conectaeimob` em `src/lib/reservedSlugs.ts` para impedir conflito com landing pages customizadas.
- Novo componente: `src/pages/ConectaEImobPortal.tsx` (página standalone, sem `<Layout>`).
- Sub-componentes em `src/components/conectaeimob-portal/`:
  - `PortalHeader.tsx`, `HeroSection.tsx`, `WhyUsSection.tsx`, `FindCtaBanner.tsx`,
    `BrokerSection.tsx`, `BlogSection.tsx`, `FinancingSection.tsx`, `PartnerCtaBanner.tsx`, `PortalFooter.tsx`.

## Estrutura visual (1:1 com os prints)

1. **Header fixo** — logo "Conecta**E**Imob" (E em destaque na cor de acento) + nav (Home, Sou Corretor, Sobre, Blog, Ajuda) + botão "Anunciar Grátis" (CTA accent arredondado).
2. **Hero** — fundo navy escuro com padrão de mapa-múndi sutil (reaproveitar `public/images/world-map-bg.svg`). Pílula "PLATAFORMA #1 EM CONEXÃO IMOBILIÁRIA". Título grande serif: "Conectamos pessoas que buscam *comprar ou vender* com corretores de imóveis" (palavras "comprar ou vender" em accent). Subtítulo. Botões "Buscar Imóveis" (accent) e "Sou Corretor →" (outline). À direita: stack de 3 cards de imóveis empilhados/rotacionados (dados reais).
3. **Faixa de stats** — "45k Imóveis anunciados · 12k Corretores ativos · 98% Clientes satisfeitos" sobre o navy.
4. **"Por que usar a ConectaEImob?"** — eyebrow accent, título serif, subtítulo, grid de 6 cards brancos com ícones (Search, CheckSquare, MessageSquare, Calculator, Shield, Target) e barra superior em gradiente. Copy idêntica aos prints.
5. **Banner CTA vermelho** — "Encontre o imóvel dos seus sonhos hoje mesmo" + botão branco "Buscar agora →", com ícone de casa em outline à direita.
6. **"Sua carteira de clientes começa aqui"** — fundo navy, eyebrow "PARA CORRETORES", 4 cards numerados (01–04) com a copy exata dos prints. Botão accent "Cadastrar como corretor".
7. **"Fique por dentro do mercado"** (Blog) — 4 cards de notícias reais (`news_posts`, últimas 4 ativas), com tag de categoria accent, título e data em pt-BR. Botão "Ver todas →" no canto.
8. **"Simule seu financiamento…"** — split: à esquerda copy + chips (Caixa Econômica, FGTS, MCMV, SBPE, Resultado imediato); à direita card branco com form simulado (valor, entrada, prazo, renda, modalidade) e botão navy "Simular agora →".
9. **Banner CTA navy** — "Seja um corretor parceiro ConectaEImob" + botão accent "Quero ser parceiro →", ícone de chave em outline.
10. **Footer** — colunas com links institucionais e redes sociais (copy genérica baseada no padrão dos prints).

## Cores e tipografia

Aplicar paleta da marca Conectae já definida em `src/index.css` (HSL):

- Fundo principal navy: `hsl(var(--primary))` (navy escuro da Conectae).
- Accent vermelho/coral dos botões e destaques: `hsl(var(--accent))`.
- Accent amarelo/laranja das palavras destacadas no hero e eyebrows: `hsl(var(--secondary))` ou novo token `--brand-gold` se necessário.
- Cards "Por que usar" com barra superior em gradiente usando `--gradient-primary`.
- Tipografia: heading serif (ex.: Playfair Display ou DM Serif Display via Google Fonts importada em `index.css`); corpo sans (Inter já no projeto). Adicionar `font-display` ao `tailwind.config.ts`.
- Tokens novos no `index.css` se faltarem: `--portal-hero-bg`, `--portal-card`, `--portal-cta-red`, `--portal-cta-navy`. Tudo em HSL, sem cores hardcoded em componentes.

## Dados reais

- **Cards de imóveis do hero (3 cards empilhados):**
  ```ts
  supabase.from('properties')
    .select('id, title, price, city, state, neighborhood, cover_image_url, photos')
    .eq('is_active', true).eq('status', 'ATIVO')
    .order('created_at', { ascending: false }).limit(3)
  ```
  Preço formatado `R$ x.xxx.xxx`, localização "Bairro, Cidade/UF". Fallback: placeholders idênticos aos prints se vier vazio.
- **Cards do blog:**
  ```ts
  supabase.from('news_posts')
    .select('id, title, category, cover_image_url, published_at')
    .eq('is_active', true)
    .order('published_at', { ascending: false }).limit(4)
  ```
  Data formatada via `date-fns/locale/pt-BR` ("15 mai 2025").
- **Stats** (45k / 12k / 98%): fixos por enquanto (não há agregação no schema atual).

## Botões / CTAs

Conforme escolhido, **todos os botões ficam visualmente prontos mas sem rota definida** (`href="#"` ou `onClick` vazio com `data-cta` para você apontar depois). Lista de CTAs entregue no commit para você nos passar os destinos:

1. Header "Anunciar Grátis"
2. Hero "Buscar Imóveis"
3. Hero "Sou Corretor →"
4. Banner vermelho "Buscar agora →"
5. Corretores "Cadastrar como corretor"
6. Blog "Ver todas →"
7. Financing "Simular agora →" (form sem submit real)
8. Banner navy "Quero ser parceiro →"
9. Footer links

## SEO

- `<title>` "ConectaEImob — Conectamos quem compra e vende com corretores"
- `meta description` < 160 chars com a copy do hero
- H1 único no hero
- `lang="pt-BR"` herdado, `translate="no"` no root da página
- Alt text descritivo nas fotos dos imóveis e nas capas das notícias
- Imagens com `loading="lazy"` exceto o hero

## Detalhes técnicos

- Página standalone: NÃO usa `<Layout>` nem `<Sidebar>`. Renderiza header/footer próprios.
- Responsivo: hero vira coluna única no mobile, grid 6→2 nos benefícios, grid 4→2→1 no blog, 4→2→1 nos cards de corretor.
- Animações sutis com Framer Motion (já no projeto): fade-up nos blocos ao entrar em viewport.
- Sem alterações em banco, edge functions ou autenticação.

## Arquivos afetados

- ✏️ `src/App.tsx` — adicionar rota `/conectaeimob`
- ✏️ `src/lib/reservedSlugs.ts` — incluir `'conectaeimob'`
- ✏️ `src/index.css` — tokens HSL específicos do portal + import de fonte serif
- ✏️ `tailwind.config.ts` — `font-display` serif
- ➕ `src/pages/ConectaEImobPortal.tsx`
- ➕ `src/components/conectaeimob-portal/*.tsx` (9 componentes listados acima)

## Fora de escopo

- Editor admin para essa página (é React fixa).
- Backend novo, tabelas, edge functions, autenticação.
- Submit real do formulário de simulação (visual apenas — você já tem `/calculadora` para a versão funcional, podemos plugar depois).
