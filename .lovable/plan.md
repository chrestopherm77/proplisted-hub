## Objetivo

Deixar o painel admin do Portal de Imóveis tão editável quanto o gerador de Landing Pages, com upload real de imagens, busca de corretor funcional e controle claro da fonte dos imóveis (próprios ou todos do portal).

## 1. Corrigir busca de corretor

A busca atual usa `.or()` com debounce e quebra quando o input já contém o nome selecionado. Substituir pelo mesmo padrão usado em `AffiliatesManagement.tsx`:

- Carregar até 2000 perfis (`profiles.select('id, name, email').order('name')`) ao abrir o diálogo.
- Usar `Popover` + `Command` (`CommandInput` filtra localmente).
- Mostrar nome + email + chip selecionado; limpar com X.

## 2. Uploads reais (sem precisar de URL)

Reaproveitar `ImageUploadField` (bucket público `landing-pages`) em todos os campos de imagem do editor:

- Logo (`branding.logo_url`) — pasta `portals/logos`
- Imagem de fundo do hero (`branding.hero_bg_url`) — `portals/hero`
- Imagem da seção Sobre (`branding.about_image_url`) — `portals/about`
- Favicon (`seo.favicon_url`) — `portals/favicon`

Cada campo continua aceitando URL manual também.

## 3. Editor com seções (estilo gerador de LP)

Reorganizar o diálogo em abas (`Tabs` shadcn) para ficar limpo e abrangente:

```text
[Geral] [Marca] [Hero] [Sobre] [Contato/Redes] [SEO] [Avançado]
```

**Geral**: corretor (novo seletor), slug, domínio, template, ativo, **Fonte dos imóveis** (com explicação clara: "Apenas meus imóveis" ou "Todos os imóveis publicados na plataforma" filtrando por cidade/UF opcional).

**Marca**: upload de logo, cor primária, cor de destaque, cor de fundo.

**Hero**: upload de fundo, título, subtítulo, textos do CTA.

**Sobre**: upload de imagem + textarea grande para o texto.

**Contato/Redes**: WhatsApp, telefone, email, endereço, CNPJ, CRECI, Instagram/Facebook/TikTok/YouTube/LinkedIn.

**SEO**: título, descrição, upload de favicon.

**Avançado**: rótulos editáveis dos itens do menu (Início, Sobre, Contato, Financie, Negocie seu Imóvel) e texto do rodapé (`branding.footer_text`, `branding.menu_labels`).

Tudo continua salvo em `branding`/`seo` (JSONB) — sem migração de schema.

## 4. Fonte dos imóveis (a função mais importante)

Já existe o campo `properties_source` (`OWN` | `CITY`) e `useBrokerPortal.fetchPortalProperties` já trata as duas fontes. Vou:

- Destacar o seletor no topo da aba **Geral** com descrição:
  - **OWN** — "Mostra apenas os imóveis cadastrados pelo corretor selecionado."
  - **CITY** — "Mostra todos os imóveis ativos da plataforma na cidade/UF informados."
- Quando `CITY`, exigir cidade (validação no save) e mostrar contador estimado em tempo real (`select count` de `properties` com filtros).
- Mostrar essa info também no card de listagem de portais.

## 5. Renderer respeita rótulos editáveis

`Header.tsx` e `Footer.tsx` passam a ler `branding.menu_labels` (com fallback aos atuais) e `branding.footer_text` no copyright.

## Arquivos afetados

- `src/components/admin/BrokerPortalsManagement.tsx` — refatorar diálogo em abas, novo seletor de corretor, uploads, contador de imóveis CITY, validações.
- `src/components/broker-portal/templates/template1/Header.tsx` — usar `menu_labels`.
- `src/components/broker-portal/templates/template1/Footer.tsx` — usar `menu_labels` + `footer_text`.

Sem mudanças no banco. Sem novos buckets (reutiliza `landing-pages`).
