## Modelo "Agnus" (Template 1) para Portal de Imóveis

Vou substituir o `Template1` placeholder atual por um site profissional inspirado nas referências enviadas (Agnus Negócios Imobiliários), totalmente editável via painel admin existente em **Portais de Imóveis**.

### Páginas / Seções

**Home (`/portal/:slug` ou domínio personalizado)**
- Header fixo: logo + menu (Início, Sobre, Contato, Financie, Negocie seu Imóvel) + WhatsApp/email + ícones sociais (Instagram, Facebook, YouTube, TikTok, LinkedIn) + favoritos
- Hero com **imagem de fundo**, logo grande centralizada e **barra de filtros** sobreposta: Negócio (Venda/Aluguel), Tipo do Imóvel, Valor mínimo, Valor máximo, Cidade, e botão "Buscar por Referência"
- Grid "Imóveis em destaque" com cards (foto carrossel, badge de status tipo "Pronto para construir / Em obras / Pronto para morar", referência, badge VENDA/ALUGUEL, cidade/UF, título, área, preço e ❤️ favoritar)
- Seção "Sobre" (bloco com imagem + texto editável)
- Footer escuro: logo, CNPJ, contatos, menu, redes sociais, copyright
- Botão flutuante de WhatsApp

**Listagem com filtros aplicados** (mesma rota com query params) — grid + paginação simples

**Detalhe do imóvel** (`/portal/:slug/imovel/:id`)
- Galeria de fotos no topo (com contador "X fotos")
- Bloco com Venda/Aluguel + preço, área total, situação
- Coluna esquerda: botão "Agendar visita", "Ficha do imóvel" (perfil, situação, mobília, área), card do corretor (nome, CRECI, telefone, email)
- Coluna direita: descrição, localização (endereço + mapa Leaflet já existente no projeto + foto)
- Formulário de contato (nome, telefone, email, mensagem) com botões WhatsApp e E-mail
- Seção "Imóveis similares"

**Favoritos** (`/portal/:slug/favoritos`) — armazenados em `localStorage` por slug.

### Editabilidade (sem mexer no banco)

Todos os textos/contatos/cores/imagens vêm dos campos `branding` e `seo` já existentes em `broker_portals`. Vou adicionar no editor admin (`BrokerPortalsManagement.tsx`) os campos novos abaixo (todos guardados dentro do JSON `branding`, sem migration):

- `hero_bg_url` — imagem de fundo do hero
- `hero_title`, `hero_subtitle` — opcional sobre a logo
- `cnpj`, `creci` — exibidos no card do corretor e footer
- `email_visible` (bool) — mostrar email ou botão "Ver e-mail"
- `about_image_url`, `about_text` — seção sobre
- `accent_color` (cor secundária, ex: dourado da referência) — além de `primary_color`
- `footer_text`
- Já existentes reutilizados: `logo_url`, `whatsapp`, `phone`, `email`, `address`, `instagram`, `facebook`, `tiktok`, `youtube`, `linkedin`, `about`, `primary_color`

Cores aplicadas via CSS variables inline no root do template (não tocam o tema global).

### Detalhes técnicos

**Arquivos novos:**
- `src/components/broker-portal/templates/template1/Template1.tsx` — orquestrador (passa a ser o novo Template 1 padrão)
- `src/components/broker-portal/templates/template1/Header.tsx`
- `src/components/broker-portal/templates/template1/Hero.tsx` (com filtros)
- `src/components/broker-portal/templates/template1/PropertyGrid.tsx`
- `src/components/broker-portal/templates/template1/PropertyCard.tsx`
- `src/components/broker-portal/templates/template1/PropertyDetail.tsx`
- `src/components/broker-portal/templates/template1/Footer.tsx`
- `src/components/broker-portal/templates/template1/WhatsAppFab.tsx`
- `src/components/broker-portal/templates/template1/useFavorites.ts`
- `src/components/broker-portal/templates/template1/filters.ts` (lógica de filtragem em memória sobre o array de `properties` já carregado)

**Arquivos editados:**
- `src/components/broker-portal/templates/Template1.tsx` → reexporta o novo template
- `src/components/broker-portal/BrokerPortalRenderer.tsx` → suporte a `view` (home / detalhe) via state interno (a navegação detalhe usa `useState` em vez de rota nova para funcionar com `BrokerDomainGate`); para a rota `/portal/:slug`, uso `useSearchParams` com `?p=<id>` para abrir o detalhe sem precisar criar rota nova
- `src/components/admin/BrokerPortalsManagement.tsx` → adicionar os novos campos do branding (hero_bg_url, accent_color, cnpj, creci, about_image_url, about_text, footer_text, email_visible)

**Reutilizo:** `PropertyMap` existente, `PropertyGallery`, `lucide-react` para ícones, e `formatBRL` util.

**Templates 2 e 3:** continuam reusando Template 1 por enquanto (já é o caso hoje).

**Sem migration de banco** — toda a configuração cabe nos JSONs já existentes.