# Nova Home Conectaê (rota de teste `/validacao`)

Uma única página que atende os dois públicos: **cliente final** (que quer achar imóvel) e **corretor** (que quer virar parceiro). Construída em rota separada `/validacao`, consumindo os imóveis reais do Portal de Imóveis. Nada da home atual (`/`) é alterado — quando aprovada, trocamos a rota.

## Estrutura da página (ordem das seções)

```text
1  Header fixo (logo + navegação + "Sou corretor" + Entrar)
2  Hero com busca de imóveis
3  Vitrine de imóveis (grid + filtros rápidos)
4  Faixa de números / prova social
5  Bloco "Para corretores" (com CTA para /corretor)
6  Giro do Mercado (notícias)
7  Como funciona (2 colunas: quem procura x quem vende)
8  FAQ curta
9  CTA final duplo + Footer
```

### 1. Header
Logo Conectaê, links âncora (Imóveis, Notícias, Para corretores), botão secundário **Sou corretor** (leva a `/corretor`) e botão primário **Entrar** (`/auth`). Vira sólido ao rolar.

### 2. Hero
Fundo com imagem de imóvel + overlay escuro.
- Título: **Encontre o imóvel certo — com um corretor de verdade do seu lado**
- Subtítulo: Imóveis anunciados por corretores parceiros em todo o Brasil. Busque, demonstre interesse e fale direto com quem entende do bairro.
- Barra de busca: Objetivo (Comprar/Alugar) · Cidade · Tipo · Faixa de preço → rola para a vitrine já filtrada.
- Link discreto abaixo: "É corretor? Anuncie seus imóveis grátis →" (`/corretor`).

### 3. Vitrine de imóveis
Imóveis ativos vindos do Portal (mesma fonte pública já usada no Portal Conectaê, sem exibir dados do corretor).
- Chips de filtro rápido: Comprar · Alugar · Casas · Apartamentos · Terrenos.
- Grid responsivo (2/3/4 colunas), 12 imóveis + botão "Ver todos os imóveis".
- Card: foto, preço, cidade/bairro, quartos/vagas/área, selo de tipo, favoritar.
- Clique abre a página do imóvel com o formulário de interesse (nome + telefone) já existente.

### 4. Faixa de números
Barra escura com contadores reais (imóveis publicados, corretores ativos, cidades atendidas, leads gerados). Sem inventar valores: vêm de contagem no banco; o que não houver dado, não entra.

### 5. Bloco "Para corretores"
Fundo escuro, layout dividido (texto + mockup do painel).
- Título: **Do outro lado do anúncio, tem um corretor crescendo com a Conectaê**
- 4 bullets: Leads qualificados de quem realmente quer comprar · Portal e site personalizado para seus imóveis · Criativos com IA em segundos · Parcerias, lançamentos e benefícios exclusivos.
- CTAs: **Quero ser parceiro** (`/corretor`) e **Ver planos** (`/planos`).

### 6. Giro do Mercado
Carrossel/grid com as 6 notícias mais recentes (`news_posts` ativas): imagem, categoria, título, data. CTA "Ver todas as notícias" → `/conectaeimob/noticias`.

### 7. Como funciona
Duas colunas de 3 passos:
- **Quero comprar/alugar:** busque → demonstre interesse → um corretor parceiro te chama.
- **Sou corretor:** cadastre-se → publique seus imóveis → receba leads e feche negócios.

### 8. FAQ
5 perguntas em accordion: é gratuito para quem busca? quem me atende? como anuncio meu imóvel? sou corretor, como participo? tem custo para o corretor?

### 9. CTA final + Footer
Faixa dividida: "Procurando um imóvel?" / "É corretor?" com os dois botões. Footer com logo, links institucionais, contato e redes.

## Detalhes técnicos

- Nova rota `/validacao` em `src/App.tsx` → `src/pages/HomeValidacao.tsx`.
- Seções em `src/components/home-v2/` (Header, Hero, PropertiesShowcase, StatsBar, ForBrokers, NewsSection, HowItWorks, Faq, FinalCta, Footer) para facilitar a troca futura para `/`.
- Imóveis: RPC pública já existente `list_portal_conectae_properties` (não expõe dados do corretor). Notícias: `news_posts` ativas.
- Clique no imóvel reaproveita o detalhe/dialog de interesse do Portal Conectaê (mesmo fluxo de lead Prata).
- Tokens semânticos do design system (sem cores hardcoded), `lang="pt-BR"`, `translate="no"`.
- SEO: `<title>` e meta description próprios, H1 único no hero, alt nas imagens, lazy loading, JSON-LD `RealEstateListing` na vitrine.

## Fora do escopo agora
Alterar a home atual `/`, mudar o Portal Conectaê existente ou qualquer regra de leads/planos.
