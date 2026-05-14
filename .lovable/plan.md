## Objetivo

Adicionar 6 novas cidades de Minas Gerais (Vertentes) aos formulários LP/LP01 e rotear automaticamente os novos leads dessas cidades para o grupo de WhatsApp das Vertentes (que já existe e atende Barbacena, São João del Rei e Tiradentes).

Cidades a incluir (MG):
- Resende Costa
- Prados
- Ritápolis
- Rio das Mortes
- Barroso
- Conceição da Barra de Minas

## Mudanças

### 1. Formulários LP / LP01 (frontend)

Hoje o `LocationSelector` dos 4 fluxos está travado em `allowedStates: ['SP']` e uma lista fixa de cidades de Ribeirão Preto e região. Vou ampliar para aceitar **SP + MG** e incluir as novas cidades em todos os fluxos:

- `src/components/leadform/steps/buy/BuyLocationBudgetStep.tsx`
- `src/components/leadform/steps/rent/RentLocationValueStep.tsx`
- `src/components/leadform/steps/build/BuildLocationStep.tsx`
- `src/components/leadform/steps/sell/SellGeneralInfoStep.tsx`

Para evitar duplicação, vou centralizar em um único arquivo `src/components/leadform/allowedRegions.ts` que exporta `ALLOWED_STATES` e `ALLOWED_CITIES`, e os 4 steps passam a importar dele. Assim, novas cidades futuras se adicionam em um só lugar.

### 2. Roteamento do grupo WhatsApp (backend)

A função `notify-lead-group` já roteia por cidade via tabela `whatsapp_city_groups` + RPC `get_groups_for_city`. O grupo das Vertentes (`120363409744685071@g.us`) já existe para Barbacena/SJDR/Tiradentes.

Basta inserir 6 novas linhas em `whatsapp_city_groups` mapeando as novas cidades MG para esse mesmo `group_jid`. Nenhuma mudança de código é necessária no backend — o roteamento passa a funcionar automaticamente.

## Detalhes técnicos

```text
src/components/leadform/
├── allowedRegions.ts          (novo — fonte única)
└── steps/
    ├── buy/BuyLocationBudgetStep.tsx     (importa de allowedRegions)
    ├── rent/RentLocationValueStep.tsx    (importa de allowedRegions)
    ├── build/BuildLocationStep.tsx       (importa de allowedRegions)
    └── sell/SellGeneralInfoStep.tsx      (importa de allowedRegions)
```

DB (via insert tool):
```sql
INSERT INTO whatsapp_city_groups (city, uf, group_jid, is_active) VALUES
  ('Resende Costa', 'MG', '120363409744685071@g.us', true),
  ('Prados', 'MG', '120363409744685071@g.us', true),
  ('Ritápolis', 'MG', '120363409744685071@g.us', true),
  ('Rio das Mortes', 'MG', '120363409744685071@g.us', true),
  ('Barroso', 'MG', '120363409744685071@g.us', true),
  ('Conceição da Barra de Minas', 'MG', '120363409744685071@g.us', true);
```

Observação: a função `get_groups_for_city` já é case/acento-insensitive (`immutable_unaccent_lower`), então o nome cadastrado pelo usuário no formulário casa corretamente independente de acentuação.

## Fora do escopo

- Não vou tocar em outras cidades/grupos existentes.
- Não vou alterar a lógica da função `notify-lead-group` nem o template da mensagem.
- Não vou criar um novo grupo WhatsApp — uso o mesmo das Vertentes.