

## Melhorias no Rastreamento de Leads

### 1. Nomes das etapas em portugues

Adicionar um mapa de traducao no `LeadTracking.tsx` para converter os IDs das etapas (ex: `buy-residential-prefs`) para nomes legiveis em portugues (ex: `Preferencias residenciais`).

### 2. Modal de detalhes do lead parcial

Ao clicar em uma linha na tabela "Leads em Espera", abrir um Dialog/modal mostrando todas as respostas que o lead preencheu ate aquele momento. Para isso:

**Banco de dados**: Adicionar coluna `form_data jsonb` na tabela `lp_partial_leads` para armazenar as respostas parciais.

**Rastreamento**: Atualizar o `trackPartialLead` no `LeadFormWizard.tsx` para salvar tambem o `formData` (intention, sell, buy, build, rent) a cada avanco de etapa.

**Admin**: No `LeadTracking.tsx`, adicionar um modal que reutiliza o `formatFormDataToSections` (ja existente em `formatFormData.ts`) para exibir as respostas de forma organizada e traduzida, igual ao modal de leads do marketplace.

### 3. Geolocalizacao no mobile

Adicionar deteccao automatica de cidade via Geolocation API do navegador ao montar o `LeadFormWizard`. Se o usuario permitir, usar reverse geocoding (API gratuita do OpenStreetMap/Nominatim) para obter cidade e estado, e pre-preencher os campos de localizacao do fluxo correspondente quando o usuario chegar na etapa de localizacao.

### Alteracoes por arquivo

| Arquivo | Acao |
|---|---|
| Migracao SQL | Adicionar coluna `form_data jsonb` em `lp_partial_leads` |
| `src/components/leadform/LeadFormWizard.tsx` | Salvar `form_data` no tracking; adicionar geolocalizacao |
| `src/components/admin/LeadTracking.tsx` | Mapa de traducao de etapas; linhas clicaveis; modal de detalhes |

### Detalhes tecnicos

**Migracao SQL:**
```text
ALTER TABLE lp_partial_leads ADD COLUMN form_data jsonb;
```

**Mapa de etapas (LeadTracking.tsx):**
```text
const stepLabels = {
  'intention': 'Intencao',
  'contact': 'Contato',
  'sell-relation': 'Relacao com imovel',
  'sell-exclusivity': 'Exclusividade',
  'sell-property-type': 'Tipo de imovel',
  'buy-purpose': 'Finalidade',
  'buy-property-type': 'Tipo de imovel',
  'buy-residential-prefs': 'Preferencias residenciais',
  'buy-location-budget': 'Localizacao e orcamento',
  'buy-payment-method': 'Forma de pagamento',
  'buy-deadline': 'Prazo',
  ... (todos os IDs mapeados)
};
```

**Geolocalizacao:**
- Usar `navigator.geolocation.getCurrentPosition()` no mount
- Reverse geocode via `https://nominatim.openstreetmap.org/reverse?lat=X&lon=Y&format=json`
- Armazenar cidade/UF detectados em um state
- Quando o usuario chegar na etapa de localizacao, os campos ja estarao pre-preenchidos
- Funciona melhor no mobile onde GPS esta disponivel; no desktop funciona via IP (menos preciso)

**Modal de detalhes:**
- Usar Dialog do shadcn/ui
- Importar `formatFormDataToSections` para formatar os dados
- Exibir secoes com titulo e campos traduzidos
- Botao de fechar

