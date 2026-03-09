

## Restringir Localização nos Formulários de Lead (/lp e /lp-01)

### O que muda

Adicionar duas props opcionais ao componente `LocationSelector`:
- `allowedStates?: string[]` — filtra os estados exibidos (ex: `['SP']`)
- `allowedCities?: string[]` — filtra as cidades exibidas (lista fixa, ignora API do IBGE)

### Arquivos alterados

**`src/components/leadform/LocationSelector.tsx`**
- Aceitar `allowedStates` e `allowedCities` como props opcionais
- Se `allowedStates` for passado, filtrar a lista de estados para mostrar apenas os permitidos
- Se `allowedCities` for passado, em vez de usar as cidades da API do IBGE, usar essa lista fixa (com IDs fictícios)
- Se houver apenas 1 estado permitido, auto-selecionar ele na montagem

**4 arquivos de steps do leadform** (Buy, Rent, Sell, Build):
- `BuyLocationBudgetStep.tsx`
- `RentLocationValueStep.tsx`
- `SellGeneralInfoStep.tsx`
- `BuildLocationStep.tsx`

Passar as novas props para o `LocationSelector`:
```tsx
<LocationSelector
  allowedStates={['SP']}
  allowedCities={[
    'Ribeirão Preto', 'Bonfim Paulista', 'Cravinhos', 'Sertãozinho',
    'Serrana', 'Jardinópolis', 'Brodowski', 'Batatais', 'Sales Oliveira',
    'Orlândia', 'Nuporanga', 'São Joaquim da Barra', 'Morro Agudo',
    'Pontal', 'Pitangueiras', 'Jaboticabal', 'Pradópolis', 'Dumont', 'Guatapará'
  ]}
  ...
/>
```

O `LocationSelector` usado no cadastro de corretores (`src/components/auth/LocationSelector.tsx`) e no perfil **não será alterado** — continua mostrando todos os estados e cidades.

