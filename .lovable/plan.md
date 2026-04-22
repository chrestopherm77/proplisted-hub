

## Garantir geocoding de 100% dos imóveis publicados

### Diagnóstico

O imóvel A0004 (Betim / Capelinha / Rua caratinga) ficou sem coordenadas. Os logs da edge function `geocode-properties` mostram apenas boot/shutdown — a função **nunca foi executada** para esse imóvel.

Causa raiz: em `NewProperty.tsx` o fluxo é:
```
insert → toast → supabase.functions.invoke(...).catch(...) → navigate(...)
```
O `navigate` desmonta a página antes do `fetch` da invoke sair do browser. Como o request é cancelado no client, a função nunca recebe a chamada (por isso não há log nem 401).

Além disso, o backfill atual só pega imóveis com `is_active = true`, e a lógica progressiva já existe mas não é acionada.

### Solução em 3 camadas (defense in depth)

#### 1. Garantir que a invoke de cadastro chegue ao servidor

Em `src/pages/NewProperty.tsx`:
- **Aguardar** a invoke antes de navegar (com `await` + timeout curto de ~8s para não travar o usuário). Se passar do timeout, segue a navegação — o disparo HTTP já saiu.
- Como fallback, usar `navigator.sendBeacon` ou `fetch(..., { keepalive: true })` direto na URL da edge function, que sobrevive à navegação.

Resultado: edge function é executada de fato logo após o cadastro.

#### 2. Trigger no banco como rede de segurança

Criar trigger `AFTER INSERT OR UPDATE OF address, neighborhood, city, state ON properties` que:
- Quando `latitude IS NULL`, insere uma linha em uma fila `pending_geocodes` (tabela nova: `id`, `property_id`, `created_at`, `attempts`, `last_error`).
- Não chama HTTP do banco (evita extensão `pg_net`); apenas marca para processar.

#### 3. Cron para drenar a fila

Adicionar cron job (Supabase scheduled function, a cada 5 min) que chama `geocode-properties` em modo backfill com service role:
- Buscar até 30 imóveis da fila `pending_geocodes` com `attempts < 5`.
- Geocodificar usando o **fallback progressivo já existente**: `endereço completo → bairro+cidade → cidade+UF`.
- Em caso de sucesso: atualizar `latitude/longitude` e remover da fila.
- Em caso de falha: incrementar `attempts`, gravar `last_error`. Após 5 tentativas, deixa parado para inspeção admin.
- Garantia: **enquanto houver cidade+UF**, sempre cai no centro da cidade — nenhum imóvel fica fora do mapa.

#### 4. Ajustes na edge function

Em `supabase/functions/geocode-properties/index.ts`:
- Aceitar autenticação via `CRON_SECRET` (header `x-cron-secret`) além de JWT, para o cron rodar sem usuário.
- Modo backfill passa a ler da tabela `pending_geocodes` em vez de varrer `properties` direto.
- Adicionar log explícito: `[geocode] property A0004: tried "Rua caratinga, Capelinha, Betim, MG" → fallback "Capelinha, Betim, MG" → success (lat,lng)`.

#### 5. Backfill imediato

Após deploy, rodar a função 1x manualmente para resolver o A0004 e qualquer outro pendente.

### Arquivos alterados

- `src/pages/NewProperty.tsx` — invoke com `keepalive` + await curto antes do navigate.
- `supabase/functions/geocode-properties/index.ts` — aceitar `CRON_SECRET`, ler de `pending_geocodes`, log detalhado.
- **Nova migração**:
  - Tabela `pending_geocodes` (RLS: só admin lê/edita; serviço usa service role).
  - Trigger `properties_enqueue_geocode` que insere na fila quando `latitude IS NULL`.
  - Cron job `*/5 * * * *` chamando a edge function com `CRON_SECRET`.

### O que NÃO muda

- `PropertyMap.tsx`, `PortalImoveis.tsx`, fluxo do usuário, RLS de `properties`.
- Nominatim continua sendo o provider (gratuito, 1 req/s respeitado).

### Resultado garantido

- Imóvel novo: geocodificado em segundos via invoke + cron de backup em 5 min.
- Endereço errado/inexistente (ex.: "Rua caratinga"): cai no centro do bairro Capelinha; se o bairro também falhar, cai no centro de Betim/MG.
- A0004 e quaisquer outros pendentes recebem coordenadas no backfill imediato.
- Nenhum imóvel ativo fica sem aparecer no mapa.

