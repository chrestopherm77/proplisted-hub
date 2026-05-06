# Modelo 2 — "Colleone Classic"

Baseado nas imagens enviadas (estilo Ricardo Colleone): cabeçalho claro com logo à esquerda, hero azul-marinho com foto, faixa de busca, seção "Imóveis Exclusivos" em destaque, grade "Imóveis em Destaque", depoimentos, banner CTA e rodapé azul-marinho.

A ideia é entregar um segundo template **completo, editável e funcional**, usando exatamente a mesma estrutura de configuração do Modelo 1 (mesmas chaves em `branding`, mesmo editor admin, mesmo sistema de menu, mesma busca de imóveis OWN/CITY). Assim o usuário pode trocar de modelo sem refazer nada.

## O que será construído

1. **Nova pasta** `src/components/broker-portal/templates/template2/` com componentes próprios:
   - `Template2.tsx` — orquestrador (substitui o atual stub que renderiza Template1)
   - `Header.tsx` — fundo branco, logo grande à esquerda, top-bar com WhatsApp/e-mail/redes, menu horizontal com item ativo destacado em azul
   - `Hero.tsx` — fundo azul-marinho com imagem (`hero_bg_url`) em overlay, faixa de busca branca sobreposta na parte inferior (Negócio, Tipo, Valor mín/máx, Cidade, Pesquisar) + alternância "Referência"
   - `ExclusivesSection.tsx` — "Imóveis Exclusivos": até 3 cards grandes com watermark da logo sobre a foto (usa imóveis marcados como destaque ou os 3 mais recentes)
   - `FeaturedGrid.tsx` — "Imóveis em Destaque": grade 4 colunas com cards estilo Colleone (faixa azul "Pronto para morar", selo Ref + VENDA, dormitórios/garagens/área, preço em vermelho, paginação)
   - `Testimonials.tsx` — carrossel de depoimentos (lê `branding.testimonials[]` quando existir; fallback para placeholders)
   - `CtaBanner.tsx` — banner "Não encontrou o que procurava? ENTRE EM CONTATO" com imagem de fundo
   - `AboutSection.tsx` — Sobre nós (mesmas chaves `about_text` / `about_image_url`)
   - `Footer.tsx` — rodapé azul-marinho com 4 colunas (logo+CNPJ, contato, menu, social) reusando `resolveMenuItems`
   - `PropertyCard.tsx` e `PropertyDetail.tsx` — visual Colleone (faixa azul superior, preço vermelho)
   - `WhatsAppFab.tsx`, `useFavorites.ts` — reaproveitam ou re-exportam os do template1
   - `types.ts` — re-exporta `FilterState`/`applyFilters` do template1 para manter a busca idêntica

2. **Reaproveitamento total da edição existente**:
   - Mesmo `branding` salvo em `broker_portals` — nada novo no banco.
   - O editor admin (`BrokerPortalsManagement.tsx`) **já cobre** todos os campos: logo upload, cores, hero, sobre nós, contatos, redes, CNPJ, CRECI, footer text, menu items configurável, fonte de imóveis (OWN/CITY).
   - Adicionar no editor uma seção opcional **"Depoimentos"** (lista editável: nome + texto) gravada em `branding.testimonials` — usada por ambos os modelos quando preenchida.
   - Adicionar campos opcionais `cta_banner_url` e `cta_banner_text` no editor para personalizar o banner CTA do Modelo 2 (Modelo 1 ignora).

3. **Catálogo e seletor**:
   - Atualizar `src/lib/portalTemplatesCatalog.ts`: Modelo 2 passa a `available: true` com nome **"Colleone Classic"** e descrição apropriada. Modelo 3 continua "em breve".
   - `BrokerPortalRenderer.tsx`: o `case 2` passa a renderizar o novo `Template2` real (hoje aponta para o stub que renderiza Template1).
   - `buildDemoPortal(2)` em `portalTemplateDemo.ts`: paleta clara (`bg #ffffff`, `accent #1e3a8a` azul-marinho, `accent_strong #b91c1c` vermelho) + 3 depoimentos demo + CTA demo, para a pré-visualização ficar fiel.

4. **Filtros e busca de imóveis**: idênticos ao Modelo 1 — `applyFilters` + `fetchPortalProperties` (OWN ou CITY) já funcionam corretamente, só serão consumidos pelo novo `Hero`/grade.

5. **Menu configurável**: o novo `Header`/`Footer` usam `resolveMenuItems(branding)`, então o editor de menu do admin continua valendo (mostrar/ocultar item, modo seção ou URL externa).

## Layout (referência Colleone)

```text
┌──────────────────────────────────────────────────────────────┐
│ [LOGO]      Início  Sobre  Contato  Anuncie    ❤ Favoritos  │  ← Header branco
├──────────────────────────────────────────────────────────────┤
│  Hero azul-marinho c/ imagem  (título opcional)              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Negócio | Tipo | Vmín | Vmáx | Cidade | [Pesquisar] │    │
│  └──────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────┤
│              IMÓVEIS EXCLUSIVOS (3 cards grandes)            │
├──────────────────────────────────────────────────────────────┤
│              IMÓVEIS EM DESTAQUE (grade 4 col)               │
├──────────────────────────────────────────────────────────────┤
│              DEPOIMENTOS (carrossel)                         │
├──────────────────────────────────────────────────────────────┤
│  Banner: "Não encontrou? ENTRE EM CONTATO"                   │
├──────────────────────────────────────────────────────────────┤
│  Footer azul-marinho: Logo | Contato | Menu | Social         │
└──────────────────────────────────────────────────────────────┘
```

## Observações técnicas

- Nada será alterado no Modelo 1; ele continua funcional.
- Edge functions, RLS e schema do Supabase **não mudam** — toda a edição já passa pelo `branding jsonb` existente.
- Pré-visualização disponível em `/portal-templates/preview/2` (rota já existente).

## Arquivos

**Novos**: `src/components/broker-portal/templates/template2/{Template2,Header,Hero,ExclusivesSection,FeaturedGrid,Testimonials,CtaBanner,AboutSection,Footer,PropertyCard,PropertyDetail,types}.tsx`

**Editados**:
- `src/components/broker-portal/templates/Template2.tsx` (passa a importar o novo Template2)
- `src/components/broker-portal/BrokerPortalRenderer.tsx`
- `src/lib/portalTemplatesCatalog.ts`
- `src/lib/portalTemplateDemo.ts` (paleta + demos por template)
- `src/components/admin/BrokerPortalsManagement.tsx` (campos `testimonials[]`, `cta_banner_url`, `cta_banner_text`)
