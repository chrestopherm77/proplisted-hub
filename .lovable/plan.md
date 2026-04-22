

## Portal de Imóveis — anúncios de imóveis com sistema de afiliação e LP pública

### O que vai ser construído

Uma nova área no menu (entre "Balcão de Parcerias" e "Lançamentos") onde corretores publicam seus imóveis com até 20 fotos, e outros corretores podem **revender o imóvel como afiliados**, gerando uma landing page pública com o contato deles no lugar do anunciante original.

### Estrutura visual

**1. Página `/portal-imoveis` (lista, autenticada)**

```text
┌──────────────────────────────────────────────────────────────┐
│ [+ Novo Anúncio]   [Todos anúncios] [Meus anúncios]          │
│                                                               │
│ [🔍 Buscar...]  [Tipo do imóvel ▼]  [Filtros]                │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│ │ Ref:A0447│  │ Ref:A0446│  │ Ref:A0445│                    │
│ │ [foto]   │  │ [foto]   │  │ [foto]   │                    │
│ │ Casa Jd  │  │ Apto Ed  │  │ Apto Jd  │                    │
│ │ Paulista │  │ Matisse  │  │ Botânico │                    │
│ │ 📍 Bairro│  │ 📍 Bairro│  │ 📍 Bairro│                    │
│ │ 🏠 Casa  │  │ 🏢 Apto  │  │ 🏢 Apto  │                    │
│ │ R$435.000│  │ R$415.000│  │ R$415.000│                    │
│ └──────────┘  └──────────┘  └──────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

- Card baseado no print que você mandou: foto principal, código de referência (auto-gerado tipo A0447), título auto-montado (`{tipo} {bairro}` — ex.: "Apartamento Jardim Botânico"), localização, tipo, preço.
- Filtros: busca textual, tipo do imóvel, faixa de preço, cidade/UF, quartos.
- Toggle "Todos anúncios" / "Meus anúncios" (igual /property-searches).

**2. Página `/portal-imoveis/novo` — Formulário de cadastro**

Tudo em selects/inputs (sem texto livre exceto descrição):

- **Fotos**: upload de até 20 fotos (drag-and-drop, reordenar, definir capa).
- **Tipo**: Apartamento / Casa / Sobrado / Cobertura / Terreno / Sala Comercial / Galpão / Sítio / Chácara.
- **Operação**: Venda / Aluguel / Venda e Aluguel.
- **Localização**: UF + Cidade (IBGE) + Bairro + Endereço (opcional).
- **Características**: quartos, suítes, banheiros, vagas de garagem, área útil (m²), área total (m²).
- **Valores**: preço de venda, valor do aluguel, condomínio, IPTU.
- **Comodidades** (multi-select com chips): Piscina, Churrasqueira, Academia, Portaria 24h, Salão de festas, Playground, Pet friendly, Mobiliado, etc.
- **Status**: Pronto pra morar / Em construção / Reformado / Precisa reforma.
- **Informações adicionais** (textarea livre).
- **Aceito afiliação**: switch (default ON) — controla se outros corretores podem usar "Anunciar este imóvel".

**3. Página `/portal-imoveis/:id` — Detalhe (autenticada)**

```text
┌──────────────────────────────────────────────────────────────┐
│ [← Voltar]                       Ref: A0447                  │
│                                                               │
│ ┌─ Galeria de fotos (carrossel grande + thumbnails) ───────┐│
│ │  [foto principal]                                          ││
│ │  ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢                                         ││
│ └────────────────────────────────────────────────────────────┘│
│                                                               │
│ Casa Jd Paulistano                       R$ 435.000,00       │
│ 📍 Rua Itapira, Ribeirão Preto/SP                            │
│ 🏠 Casa · 3 quartos · 2 vagas · 180m²                        │
│                                                               │
│ Comodidades: Piscina · Churrasqueira · Pet friendly          │
│                                                               │
│ Informações adicionais:                                      │
│ Lorem ipsum...                                                │
│                                                               │
│ ┌─ Anunciado por ─────────────────────────────┐             │
│ │ 👤 João da Silva — CRECI 12345              │             │
│ │ [💬 Falar no WhatsApp]                       │             │
│ └──────────────────────────────────────────────┘             │
│                                                               │
│ ┌─ Ações ─────────────────────────────────────┐             │
│ │ [⬇ Baixar fotos (.zip)]                      │             │
│ │ [🚀 Anunciar este imóvel]                    │             │
│ │ [🔗 Copiar link público]                     │             │
│ └──────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

**4. Página `/imovel/:slug` — LP pública (sem autenticação)**

- Rota pública (acessível mesmo deslogado).
- Mesma galeria + descrição + comodidades do detalhe.
- **Bloco de contato dinâmico**: quando aberto via "Anunciar este imóvel", mostra nome + WhatsApp do **afiliado** (corretor que clicou); quando aberto pelo link original, mostra contato do **dono do anúncio**.
- O `slug` carrega quem é o "anunciante atual": link original = `/imovel/A0447`, link afiliado = `/imovel/A0447-aff-{token}`.
- Layout limpo, sem sidebar/menu interno do sistema.

### Fluxos

**Anunciar este imóvel (afiliação)**
1. Corretor B clica em "Anunciar este imóvel" no detalhe do anúncio do Corretor A.
2. Sistema gera (ou recupera) um registro em `property_affiliates` com token único.
3. Abre nova aba: `/imovel/A0447-aff-{token}`.
4. Essa LP mostra o imóvel com nome/WhatsApp do Corretor B no bloco de contato.
5. Corretor B pode copiar o link e divulgar onde quiser — qualquer pessoa abre sem login.

**Baixar fotos**
- Botão gera `.zip` no cliente (usando `jszip`) com todas as fotos do imóvel em alta resolução.

**Copiar link público**
- Copia `https://{dominio}/imovel/A0447` (link do dono) ou o link com token (se o usuário logado for afiliado).

### Banco de dados (3 tabelas novas + 1 bucket)

**Tabela `properties`** — anúncios
- `id`, `user_id` (dono), `reference_code` (auto: A0001, A0002...), `title` (auto: tipo + bairro)
- `property_type`, `operation_type` (sale/rent/both)
- `state`, `city`, `neighborhood`, `address`
- `bedrooms`, `suites`, `bathrooms`, `parking_spots`, `area_useful`, `area_total`
- `price_sale`, `price_rent`, `condo_fee`, `iptu`
- `amenities` (jsonb array), `status`, `additional_info` (text)
- `photos` (jsonb array de `{url, order, is_cover}`)
- `accept_affiliation` (boolean), `is_active` (boolean)
- `created_at`, `updated_at`

**Tabela `property_affiliates`** — corretores que afiliaram
- `id`, `property_id`, `affiliate_user_id`, `token` (slug curto único)
- `created_at`
- UNIQUE(`property_id`, `affiliate_user_id`)

**Tabela `property_views`** (opcional, métricas) — registra visualizações da LP pública
- `id`, `property_id`, `affiliate_id` (nullable), `viewed_at`

**Bucket `properties`** (público)
- Pasta por usuário: `{user_id}/{property_id}/{filename}`
- Políticas: leitura pública; insert/update/delete pelo dono.

**RLS**
- `properties`: SELECT público (qualquer autenticado vê todos ativos); INSERT/UPDATE/DELETE somente dono ou admin. Para a LP pública, criar uma RPC `get_public_property(slug)` SECURITY DEFINER que retorna dados sem expor toda a tabela.
- `property_affiliates`: SELECT pelo dono do imóvel ou pelo próprio afiliado; INSERT pelo usuário autenticado; tokens lidos via RPC pública também.

### Detalhes técnicos

- **Novos arquivos**:
  - `src/pages/PortalImoveis.tsx` (lista)
  - `src/pages/NewProperty.tsx` (formulário)
  - `src/pages/PropertyDetail.tsx` (detalhe interno)
  - `src/pages/PublicPropertyLP.tsx` (LP pública, sem `<Layout>`)
  - `src/components/portal/PropertyCard.tsx`
  - `src/components/portal/PropertyGallery.tsx` (carrossel)
  - `src/components/portal/PropertyPhotosUpload.tsx` (upload com reorder)
  - `src/components/portal/AmenitiesPicker.tsx`
  - `src/lib/propertyUtils.ts` (gerar reference_code, montar título, gerar slug afiliado)

- **Rotas em `App.tsx`**:
  - `/portal-imoveis` (autenticada)
  - `/portal-imoveis/novo` (autenticada)
  - `/portal-imoveis/:id` (autenticada)
  - `/imovel/:slug` (pública — sem checagem de auth)

- **Sidebar (`AppSidebar.tsx` + `MobileMenu.tsx`)**: novo item "Portal de Imóveis" com ícone `Building2`, escondido em `isPartnerSite` (igual Balcão).

- **Reuso**: hook `useIBGELocation` (UF/cidade), `formatCurrency` de `Launches.tsx`, `normalizePhoneToWa` / `buildWaLink` de `src/lib/whatsapp.ts`, padrão de upload do bucket `launches`.

- **Dependência nova**: `jszip` (download em lote de fotos no cliente).

- **Geração de `reference_code`**: trigger `BEFORE INSERT` que pega `MAX(reference_code)` e incrementa (formato `A0001`).

- **Geração de título auto**: trigger ou função client-side concatenando `{property_type} {neighborhood}` (ex.: "Apartamento Jardim Botânico"). Editável manualmente no formulário se quiser.

### O que NÃO vai ser feito agora

- Sistema de comissão/split de venda (apenas redireciona contato — não rastreia transação).
- Pagamento por anúncio (todos os anúncios são gratuitos).
- Edição inline do anúncio (criar primeiro, depois posso adicionar tela de edição se quiser).
- Moderação admin (admin pode deletar via Admin Panel numa fase futura).

### Resultado

- Corretor cadastra imóveis com fotos e dados estruturados.
- Outros corretores veem na lista, abrem o detalhe e podem se afiliar com um clique.
- Cada afiliado gera sua própria LP pública compartilhável (com WhatsApp dele).
- Qualquer pessoa, mesmo sem login, abre o link público e fala direto com o corretor que enviou o link.
- Fotos baixáveis em `.zip` para reuso em redes sociais.

