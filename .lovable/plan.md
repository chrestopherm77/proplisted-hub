

## Ajustes no Portal de Imóveis: Status e Comodidades

### O que muda

**1. Status do imóvel** (formulário de cadastro/edição)

Hoje as opções são: Pronto pra morar / Em construção / Reformado / Precisa reforma.

Trocar para exatamente:
- Na Planta
- Em Construção
- Imóvel Novo
- Imóvel Usado

**2. Comodidades** (do select simples atual para um seletor estruturado por categorias)

A lista atual (Piscina, Churrasqueira, Academia…) é substituída por uma estrutura em duas grandes seções, cada uma com subgrupos colapsáveis:

**A) Comodidades do Condomínio** (8 grupos)
- Bem-Estar e Saúde — Piscina Adulto com raia, Piscina Adulto e Infantil, Piscina Aquecida/Coberta, Sauna, Jacuzzi, Ofurô, Sala de massagem, Academia indoor, Academia outdoor, Sala de Pilates/Yoga, Espaço Mulher/Beauty Care
- Social e Entretenimento — Salão de Festas, Espaço Gourmet, Rooftop, Sala de Jogos, Cinema, Espaço Influencer
- Conveniência e Serviços — Market, Sala de Delivery, Lavanderia, Car Wash, Ferramentaria, Pet Care, Wi-fi áreas comuns, Recarga de Carros Elétricos, Car Sharing
- Business — Coworking, Sala de Reunião
- Esportes e Mobilidade — Quadra de Tênis, Quadra de Areia, Quadra Poliesportiva, Campo de Futebol, Bicicletário
- Kids e Natureza — Playground, Brinquedoteca, Casa na Árvore, Pet Place, Redário, Horta Comunitária, Pomar, Praça de Convivência
- Segurança e Tecnologia — Portaria 24h, Reconhecimento Facial, Cerca Elétrica/Câmeras
- Outros — campo livre para o usuário adicionar itens personalizados (chips removíveis)

**B) Características do Imóvel** (4 grupos, cada item é um “select” de opções fixas, não checkbox)
- Acabamento e Conforto Térmico/Acústico — Tipo de Piso, Climatização, Tratamento Acústico, Iluminação, Aquecimento, Persianas/Fechamento, Pé-direito
- Cozinha, Copa e Área de Serviço — Estilo de Cozinha/Copa, Armários, Equipamentos (multi), Área de Serviço, Dependências/Sanitários, Gás Canalizado (Sim/Não)
- Áreas Externas e Expansão — Perfil da Varanda, Churrasqueira/Social, Fechamento/Proteção, Lazer/Diferencial, Espaço Garden
- Tecnologia, Segurança e Sustentabilidade Interna — Acesso, Automação/TI, Vaga de Garagem

Cada subitem aparece como um grupo de chips selecionáveis (multi-seleção) com o título do quesito acima — ex.: “Tipo de Piso” → chips Porcelanato, Vinílico, Madeira Maciça, etc.

### Como será exibido

- **No formulário de cadastro** (`NewProperty.tsx`): seções colapsáveis (Accordion) por grupo, dentro de duas abas/blocos: “Condomínio” e “Características do Imóvel”. Campo “Outros” no fim para itens livres.
- **Na página de detalhes** (`PropertyDetail.tsx` / `PublicPropertyLP.tsx`): renderiza apenas os grupos que tiverem itens selecionados, agrupados por título.
- **No card** (`PropertyCard.tsx`): continua mostrando só os 3 primeiros itens (preview), sem mudança visual.

### Estrutura de dados

A coluna `properties.amenities` (jsonb) hoje é um array simples de strings. Vai virar um objeto estruturado:

```json
{
  "condo": {
    "wellness": ["Sauna", "Jacuzzi"],
    "social": ["Rooftop"],
    "others": ["Bar molhado"]
  },
  "property": {
    "floor_type": ["Porcelanato"],
    "climate": ["Ar-condicionado Instalado"],
    "gas_canalizado": "Sim"
  }
}
```

**Compatibilidade**: imóveis antigos (array de strings) continuam sendo lidos — uma função de leitura (`normalizeAmenities`) detecta o formato antigo e mostra como um grupo único “Geral” na exibição. Não precisa migração SQL nem backfill.

### Arquivos técnicos afetados

- `src/lib/propertyUtils.ts` — substituir `AMENITIES` e `PROPERTY_STATUS`. Adicionar:
  - `PROPERTY_STATUS` novo (4 valores).
  - `CONDO_AMENITIES` (objeto agrupado).
  - `PROPERTY_FEATURES` (objeto agrupado com quesitos e opções).
  - Helpers: `normalizeAmenities(value)`, `getAmenityGroupLabel(key)`.
- `src/components/portal/AmenitiesPicker.tsx` — reescrever como Accordion + chips por grupo + campo "Outros" com input + chips removíveis.
- `src/components/portal/PropertyFeaturesPicker.tsx` — **novo**, mesma mecânica para o bloco "Características do Imóvel".
- `src/pages/NewProperty.tsx` — usar os dois pickers; salvar `amenities` no novo formato; status = novo enum.
- `src/pages/PropertyDetail.tsx` e `src/pages/PublicPropertyLP.tsx` — leitura via `normalizeAmenities`, render por grupos.
- `src/components/portal/PropertyCard.tsx` — usar `normalizeAmenities` para flatten do preview.

### O que NÃO muda

- Schema do banco (continua `jsonb`).
- RLS, fluxo de upload de fotos, geocoding, mapa, filtros do Portal.
- Imóveis já cadastrados continuam funcionando (compatibilidade retroativa via `normalizeAmenities`).

### Resultado

- Status com as 4 opções pedidas.
- Condomínio: 8 categorias com seleção múltipla + "Outros" livre.
- Imóvel: 4 categorias com quesitos detalhados (piso, climatização, etc.).
- Cadastros antigos seguem renderizando normalmente.

