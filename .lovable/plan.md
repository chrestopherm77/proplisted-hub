
# Modelo 3 — "Maison Boutique"

Baseado nas imagens enviadas (estilo Maison Vinhedo): identidade boutique com fundo bege/creme claro, logo centralizado no topo, menu abaixo do logo com item ativo em verde-oliva/marrom, hero com imagem grande, faixa de busca em verde-oliva sobreposta, e duas grades separadas — **Venda** e **Locação**.

Mantém a mesma lógica dos modelos 1 e 2: usa o `branding` existente, o editor admin atual e o sistema de menu/filtros já consolidados. Toda a configuração (logo, cores, contatos, menu, fonte de imóveis OWN/CITY, depoimentos, banner CTA) continua funcionando sem novas tabelas no banco.

## O que será construído

1. **Nova pasta** `src/components/broker-portal/templates/template3/`:
   - `Template3.tsx` — orquestrador (substitui o stub atual que renderiza Template1)
   - `Header.tsx` — fundo bege/creme, **logo grande centralizado** no topo, telefone+WhatsApp à esquerda, ícones sociais à direita, menu horizontal centralizado abaixo do logo (item ativo com fundo verde-oliva/marrom)
   - `Hero.tsx` — imagem grande full-width (`hero_bg_url`) com **faixa de busca verde-oliva** sobreposta no rodapé do hero (Negócio, Tipo, Valor mín/máx, Cidade, Bairros, Condomínios, Pesquisar) + alternância "Referência"
   - `FeaturedSale.tsx` — seção "Imóveis em destaque - Venda" (grade 4 colunas, cards estilo Maison: tag "Pronto para morar" verde-oliva, info bairro/cidade, ícones suítes/garagens/área, **preço em verde-oliva**, paginação simples)
   - `FeaturedRent.tsx` — seção "Imóveis em destaque - Locação" (mesma estrutura, filtra `operation_type RENT/BOTH`)
   - `BuildOrBuySection.tsx` — bloco "Comprar casa pronta ou construir" (3 cartões grandes com imagem e CTA opcional — usa `branding.build_or_buy[]` quando preenchido; fallback com 3 placeholders demo)
   - `AboutSection.tsx` — Sobre nós (mesmas chaves `about_text` / `about_image_url`, layout boutique 2 colunas)
   - `Testimonials.tsx` — reaproveita o do template2 (carrossel) quando `branding.testimonials[]` existir
   - `CtaBanner.tsx` — banner "Encontre seu imóvel ideal" com imagem (usa `cta_banner_url` / `cta_banner_text`)
   - `Footer.tsx` — banner de imagem acima + rodapé verde-oliva com 4 colunas (logo+copyright | endereço+contato+corretor/CRECI | menu | social), reusando `resolveMenuItems`
   - `PropertyCard.tsx` — visual Maison (tag verde, preço verde-oliva)
   - `types.ts` — re-exporta `FilterState`/`applyFilters` do template1

2. **Reaproveitamento total da edição existente**:
   - Mesmo `branding` em `broker_portals` — **nada novo no banco**.
   - Editor admin (`BrokerPortalsManagement.tsx`) já cobre tudo: logo, cores, hero, sobre, contatos, menu, fonte de imóveis, depoimentos, CTA banner.
   - Adicionar opcionalmente no editor a seção **"Comprar ou Construir"** (até 3 itens: imagem + título + descrição + link), gravada em `branding.build_or_buy[]`. Modelos 1 e 2 ignoram.

3. **Catálogo e roteamento**:
   - `portalTemplatesCatalog.ts`: Modelo 3 passa a `available: true` com nome **"Maison Boutique"**.
   - `Template3.tsx` raiz: passa a re-exportar o novo `template3/Template3` (hoje aponta para Template1).
   - `BrokerPortalRenderer.tsx` já roteia `case 3` corretamente.
   - `buildDemoPortal(3)` em `portalTemplateDemo.ts`: paleta clara (`bg #f1ede4` bege, `accent #5a6b3f` verde-oliva, `accent_strong #8b6f3f` marrom-bronze) + 3 itens demo de "comprar ou construir" + depoimentos + CTA banner para a pré-visualização ficar fiel.

4. **Filtros e busca**: idênticos aos modelos 1/2 — `applyFilters` e `fetchPortalProperties` (OWN/CITY) reaproveitados.

5. **Menu configurável**: novo `Header`/`Footer` usam `resolveMenuItems(branding)`, então o editor de menu do admin continua valendo (mostrar/ocultar, modo seção ou URL externa).

## Layout de referência

```text
┌──────────────────────────────────────────────────────────────┐
│ (11) 99809-7952 ☎       [LOGO CENTRAL]            [IG][FB]   │  ← Header bege
│            Início  Sobre  Contato  Financie  Negocie  ♥      │
├──────────────────────────────────────────────────────────────┤
│  Hero c/ imagem grande full-width                            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ [faixa verde-oliva] Negócio | Tipo | Vmín | Vmáx |…  │    │
│  └──────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────┤
│        Imóveis em destaque - VENDA  (grade 4 col)            │
├──────────────────────────────────────────────────────────────┤
│        Imóveis em destaque - LOCAÇÃO (grade 4 col)           │
├──────────────────────────────────────────────────────────────┤
│        Comprar casa pronta ou construir (3 cards)            │
├──────────────────────────────────────────────────────────────┤
│        Sobre nós | Depoimentos | CTA banner                  │
├──────────────────────────────────────────────────────────────┤
│  Banner imagem                                                │
│  Footer verde-oliva: Logo | Endereço/Contato | Menu | Social │
└──────────────────────────────────────────────────────────────┘
```

## Observações técnicas

- Modelos 1 e 2 não são alterados.
- Sem mudanças no schema do Supabase, RLS ou edge functions.
- Pré-visualização disponível em `/portal-templates/preview/3` (rota já existe).

## Arquivos

**Novos**: `src/components/broker-portal/templates/template3/{Template3,Header,Hero,FeaturedSale,FeaturedRent,BuildOrBuySection,AboutSection,Testimonials,CtaBanner,Footer,PropertyCard,types}.tsx`

**Editados**:
- `src/components/broker-portal/templates/Template3.tsx` (passa a importar o novo Template3)
- `src/lib/portalTemplatesCatalog.ts` (Modelo 3 disponível, nome "Maison Boutique")
- `src/lib/portalTemplateDemo.ts` (paleta bege + verde-oliva + demos `build_or_buy`)
- `src/components/admin/BrokerPortalsManagement.tsx` (editor opcional para `branding.build_or_buy[]`)
