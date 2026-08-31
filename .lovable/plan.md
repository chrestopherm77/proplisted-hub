# Nova `/validacao` segundo o Guia de Design Conectaê

Recriar a home de validação aplicando integralmente o guia enviado: paleta, gradientes, Poppins + Manrope, botões pill, cards arredondados com sombra azulada e a ordem de seções definida no documento. Continua tudo na rota `/validacao` — a home atual `/` não muda.

## Identidade visual (novos tokens)

Novo bloco de tokens escopado ao site v2 (não altera as cores do sistema interno):

- Azuis: `#10294B`, `#0B4FA8`, `#0E65D8`, `#0DA2E7`
- Verdes: menta `#8FE3C7` (accent), ação `#28AF60` (CTA/preço)
- Fundos claros: `#F6FBFF`, `#ECF5FE`, `#DCEBFA`; bordas `#DCEAF8`; footer `#0B2038`
- Textos: `#16233F`, `#4A5A72`, `#D8E8FB`, `#8FA0BC`
- Gradiente escuro de marca e gradiente claro conforme o guia, como tokens reutilizáveis
- Fontes: Poppins (títulos 600/700/800) + Manrope (corpo 400/700) via Google Fonts
- Botões sempre pill (raio 999px), cards 18-24px, campos 12-14px, sombras tonalizadas em azul-marinho
- Alternância obrigatória claro/escuro entre seções

## Estrutura da página

```text
1  Header escuro (#10294B, logo branca, nav, Entrar + Anunciar grátis)
2  Hero gradiente escuro: kicker, H1 com "imóvel ideal" em verde-menta,
   subtexto, 2 CTAs, card de busca flutuante, link "É corretor?"
3  Imóveis disponíveis (#F6FBFF) — filtros pill + grid 3 colunas
4  Para corretores (gradiente escuro) — 4 feature cards + 2 CTAs
5  Giro do Mercado (#ECF5FE) — notícias reais
6  Como funciona (#F6FBFF) — bloco claro x bloco escuro, 3 passos cada
7  FAQ (#ECF5FE) — accordion, primeira aberta
8  CTA final dividido (painel claro / painel gradiente)
9  Footer #0B2038 — logo, tagline, sociais, 3 colunas, aviso CRECI
```

Detalhes por seção seguem os textos do guia (kickers, H1, subtextos, features, perguntas do FAQ, tagline do rodapé).

## Dados

Nada muda no backend. Continua consumindo:
- Imóveis: RPC pública `list_portal_conectae_properties` (sem dados do corretor), com o mesmo fluxo de interesse (lead Prata).
- Notícias: `news_posts` ativas.
- Grid inicial de 6 imóveis + "Ver todos os imóveis".

## Ajustes de estrutura

- `HomeIntro` é absorvido pelo novo Hero (logo + copy institucional entram no hero), evitando duas seções escuras seguidas.
- Notícias passam para grid de 3 colunas conforme o guia; o marquee automático atual sai. Se preferir manter o marquee, é só avisar.
- Cards de imóvel do portal ganham a versão do guia: badges sobrepostos, referência, localização com pin, metadados e preço em Poppins 800 azul.

## Detalhes técnicos

- Tokens novos em `src/index.css` sob um escopo `.site-v2` + extensão em `tailwind.config.ts`; nenhuma cor hardcoded nos componentes.
- Import das fontes Poppins/Manrope adicionado ao CSS global.
- Componentes reescritos em `src/components/home-v2/`: `HomeHeader`, `HomeHero` (com search card), `PropertiesShowcase`, `ForBrokers`, `NewsSection`, `HowItWorks`, `HomeFaq`, `FinalCta`, `HomeFooter`. `HomeIntro` e `StatsBar` deixam de ser usados.
- Logos: uso da logo branca existente em header/footer e da colorida em fundos claros. As artes `logo-branca/colorida/icone` citadas no guia não vieram anexadas — sigo com as que já estão no projeto.
- Ícones line-art via lucide-react (stroke ~2), sem emoji.
- SEO: title e meta description próprios, H1 único no hero, alt nas imagens, lazy loading, JSON-LD `ItemList`/`RealEstateListing`.
- `lang="pt-BR"`, `translate="no"`, responsivo (grid 3 colunas → 2 → 1).

## Fora do escopo

Home atual `/`, Portal Conectaê existente, regras de leads, planos e qualquer mudança de banco.
