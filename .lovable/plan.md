
## Ajustes solicitados

### 1. Painel de créditos em `/leads` — remover o título "Seu saldo"
Em `src/pages/Leads.tsx` (linhas 484-487) o painel amarelo tem:
- "Seu saldo" (título)
- "{N} créditos" (valor)

Vou remover apenas o `<p>Seu saldo</p>`, mantendo o ícone, o valor e a palavra "créditos" como está.

### 2. Header da página `Balcão de Parcerias` (`src/pages/PropertySearches.tsx` linhas 533-538)
Trocar:
- Título: `Mural de Demandas` → **`Central de Demandas`**
- Subtítulo: `Encontre compradores com o perfil exato...` → **`Conecte-se com quem tem o imóvel ideal. Compartilhe o que o seu cliente busca e deixe que os parceiros tragam as oportunidades até você.`**
- Botão: `Interesse do Comprador` → **`Interesse do Cliente`**

### 3. Formulário de novo interesse (`src/pages/NewPropertySearch.tsx`) — Quartos e Vagas como botões 1, 2, 3, 4+
Hoje os campos `bedrooms` e `parkingSpots` são `<Input>` livres. Vou trocar por uma grid de 4 botões (estilo "chip selecionável") com as opções `1`, `2`, `3`, `4+`, usando `Button` com variante condicional (`default` quando selecionado, `outline` caso contrário). Mantém o estado como string ("1", "2", "3", "4+") — compatível com o que já é gravado no banco como `text`.

Aplicado apenas para os tipos que possuem esses campos (controlado pelo `fieldConfigs.hasBedrooms` e `hasParking` que já existe).

### Arquivos
- editar `src/pages/Leads.tsx` (remover linha do "Seu saldo")
- editar `src/pages/PropertySearches.tsx` (header: título, subtítulo, label do botão)
- editar `src/pages/NewPropertySearch.tsx` (trocar inputs de quartos/vagas por seleção de chips 1/2/3/4+)
