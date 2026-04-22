

## Corrigir geocoding de imóveis novos + backfill automático

### Problema

O imóvel A0003 (Betim/Alvorada/Rua Santo Antônio) foi cadastrado mas ficou com `latitude/longitude = NULL`, então não pinga no mapa. Causa: o `geocodeAndSaveProperty` é chamado **no client** logo antes de o usuário ser redirecionado pra outra página — o fetch ao Nominatim é cancelado pelo browser, ou o Nominatim recusa requests vindas direto do navegador (sem `User-Agent` controlado).

### Solução

**Mover o geocoding para o servidor** (edge function), garantindo que ele rode até o fim e respeite o rate limit do Nominatim.

#### 1. Refatorar edge function `geocode-properties`

Hoje ela só faz backfill em lote. Vou aceitar 2 modos:

- **Modo single** (`POST { property_id }`): geocodifica 1 imóvel específico imediatamente. Chamado pelo `NewProperty.tsx` após salvar/editar.
- **Modo backfill** (sem body, ou `{ backfill: true }`): comportamento atual — pega até 50 imóveis com lat NULL e geocodifica em lote (1 req/s).
- Ambos validam JWT do usuário; modo single permite o **dono do imóvel** ou admin; modo backfill segue só admin.

#### 2. Atualizar `NewProperty.tsx`

Trocar a chamada client-side `geocodeAndSaveProperty(...)` por `supabase.functions.invoke('geocode-properties', { body: { property_id: data.id } })`. Continua em background (`.then().catch()`), sem bloquear navegação.

#### 3. Backfill imediato dos imóveis já cadastrados sem coordenadas

Após o deploy da função, rodar a edge function em modo backfill (admin chama 1 vez). Resultado esperado: o A0003 e qualquer outro pendente ganham lat/lng. Vou indicar a chamada via `supabase--curl_edge_functions` durante a implementação.

#### 4. Melhorar fallback de geocoding

Se Nominatim não achar o endereço completo (`rua, bairro, cidade, estado`), tentar progressivamente:
1. `endereço, bairro, cidade, UF, Brasil`
2. `bairro, cidade, UF, Brasil`
3. `cidade, UF, Brasil`

Assim mesmo endereços inexistentes no OSM caem no centro do bairro/cidade — pelo menos aparecem no mapa.

#### 5. (Opcional) Manter `geocodeProperty.ts` client-side

Deixar o arquivo, mas não é mais usado por `NewProperty.tsx`. Pode ser removido depois.

### Arquivos alterados

- `supabase/functions/geocode-properties/index.ts` — aceitar modo single + fallback progressivo.
- `src/pages/NewProperty.tsx` — trocar chamada direta por `supabase.functions.invoke`.

### O que NÃO muda

- Tabela `properties`, `PropertyMap.tsx`, RLS, fluxo do Portal, toggle Lista/Mapa.

### Resultado

- Imóvel novo cai no mapa em poucos segundos após cadastro.
- A0003 (Betim/Alvorada) e quaisquer outros pendentes recebem coordenadas no backfill imediato.
- Endereços que o Nominatim não acha ainda aparecem no centro do bairro/cidade.

