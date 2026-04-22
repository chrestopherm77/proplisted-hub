

## Mapa de Imóveis no Portal — botão "Ver mapa" com clusters interativos

### 1. Geocoding dos imóveis (lat/lng)

A tabela `properties` hoje só tem cidade/bairro/endereço — sem coordenadas. Para mostrar pinos no mapa precisamos de lat/lng.

**Migração SQL**:
- Adicionar colunas `latitude DOUBLE PRECISION` e `longitude DOUBLE PRECISION` em `properties`.
- Atualizar `get_public_property` pra retornar essas colunas (uso futuro).

**Geocoding automático**:
- Usar **Nominatim (OpenStreetMap)** — gratuito, sem API key, mesmo serviço já usado em `LeadFormWizard.tsx`.
- Quando o imóvel for criado/editado em `NewProperty.tsx`, após salvar, fazer fetch:
  `https://nominatim.openstreetmap.org/search?q={endereço, bairro, cidade, estado}&format=json&limit=1&countrycodes=br`
- Pegar `lat`/`lon` da resposta e atualizar a linha. Se falhar, segue sem coordenadas (mapa só não exibe esse pino).
- Backfill: edge function manual (chamada uma vez pelo admin) ou rodar geocode preguiçoso quando o admin abrir o mapa pela primeira vez. Opção mais simples: **edge function `geocode-properties`** que pega todos `is_active = true AND latitude IS NULL` em lotes de 20 com `setTimeout` 1s entre chamadas (Nominatim limita 1 req/s) e gravar lat/lng. Acionada manualmente uma vez agora + automaticamente no `NewProperty` daqui pra frente.

### 2. Biblioteca do mapa

**Leaflet + react-leaflet + leaflet.markercluster** (gratuito, sem API key, igual o visual da imagem).
- `leaflet`, `react-leaflet`, `leaflet.markercluster`, `react-leaflet-cluster` via npm.
- Tiles: OpenStreetMap (`https://{s}.tile.openstreetmap.org/...`).
- Clustering nativo: bolinha vermelha com número, expande conforme dá zoom — exatamente como nas imagens enviadas.

### 3. Toggle "Lista / Mapa" no Portal

`src/pages/PortalImoveis.tsx`:
- Adicionar dois botões topo direito (ao lado de "Novo Anúncio") tipo abas: **Lista** (atual) e **Mapa**.
- State `viewMode: 'list' | 'map'` controla qual renderiza.
- Filtros (busca, tipo, operação, abas todos/meus) continuam aplicáveis aos dois modos.

### 4. Componente `PropertyMap.tsx`

Novo `src/components/portal/PropertyMap.tsx`:
- Recebe `properties: Property[]` (já filtradas pelo Portal).
- Filtra só os que têm `latitude && longitude`.
- Renderiza `<MapContainer>` ocupando ~70vh.
- `<MarkerClusterGroup>` envolvendo um `<Marker>` por imóvel.
- Centro inicial: média das coordenadas dos imóveis filtrados (ou Brasil `[-15, -55]` zoom 4 se vazio).
- Cada `<Marker>` tem um `<Popup>` com:
  - Foto de capa (mini)
  - Título (`{tipo} em {cidade}`)
  - Bairro · Zona
  - Preço
  - Botão "Ver detalhes" → `/portal-imoveis/{id}`
- **Filtro por viewport** (igual segunda imagem): listener no evento `moveend`/`zoomend` do mapa filtra só os pinos visíveis no bounds atual; opcionalmente exibe um contador "X imóveis nesta área" no topo do mapa.

### 5. CSS do Leaflet

Importar `leaflet/dist/leaflet.css` e `leaflet.markercluster/dist/MarkerCluster.css` no `main.tsx` ou no próprio componente.
- Customizar cor do cluster pra vermelho/primary do projeto via CSS override (`.marker-cluster-small`, `.marker-cluster-medium`, `.marker-cluster-large`) — bem parecido com as imagens.

### 6. Detalhes técnicos

- Sem API key: Leaflet + OSM tiles + Nominatim são totalmente gratuitos.
- Imóveis sem geocode aparecem normalmente na lista, só não pingam no mapa.
- Edge function `geocode-properties` respeita rate limit de 1 req/s do Nominatim e usa `User-Agent: LeadBay/1.0` (exigido pela política deles).
- Performance: clustering aguenta milhares de pinos sem travar.

### 7. O que NÃO muda

- Card da lista, fluxo de cadastro, sistema de afiliação, match WhatsApp, pop-up de indicação.
- RLS, tabelas existentes (só ganha 2 colunas).

### Resultado

- No Portal, usuário escolhe entre **Lista** e **Mapa**.
- No mapa, vê bolinhas vermelhas com número agrupando imóveis por região; ao dar zoom, os clusters se abrem e viram pinos individuais.
- Movimentar/zoom no mapa filtra automaticamente os imóveis visíveis na área (estilo Zap/QuintoAndar).
- Clica num pino → popup com foto, info principal e botão pra ver detalhe.

