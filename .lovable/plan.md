## Mudanças

### 1) Página `/alugue-em-parceria` (`src/pages/RentalPartnership.tsx`)

**Slogan (header):**
- Título: `Alugue em Parceria: Ganhe Dinheiro com Indicações de Locação`
- Subtítulo: `Indique clientes para imobiliárias que gerenciam carteiras de locação e receba comissões (em taxa única ou recorrência mensal), sem se preocupar com a burocracia da administração.`

**Modal "Dados do imóvel" (Estou com proprietário):**
- `Tipo de imóvel`: já é Select — manter.
- `UF`: trocar Input por Select usando `useIBGELocation` (states).
- `Cidade`: trocar Input por Select dependente da UF (cities via IBGE).
- `Bairro` → renomear para `Zona`, Select com `ZONE_OPTIONS` de `@/lib/propertyUtils`.
- `Valor pretendido`: tirar o `*`, deixar opcional (remover da validação).
- `Dormitórios`: **remover**.
- `Observações`: **remover**.
- Atualizar mensagem WhatsApp para refletir os campos restantes (sem dormitórios/obs, valor só se preenchido, "Zona" no lugar de "bairro").

**Cards de parceira:**
- Mostrar múltiplas cidades/UFs (lista de regiões atendidas) em vez de uma única.
- Mostrar website (se houver) como link discreto.
- Exibir banner topo do card (se houver), estilo Lançamentos (faixa de imagem acima do conteúdo).
- Mostrar os dois novos campos de comissão (Locatário / Proprietário) quando preenchidos, cada um com "(no 1º pagamento)" ou "(recorrente)".

**Filtros UF/Cidade:** ajustar `filtered` para considerar a lista de regiões atendidas (match se qualquer região bate).

### 2) Admin (`src/components/admin/RentalPartnersManagement.tsx`)

Modal "Nova/Editar parceira":
- **Remover** campos visíveis `Slug` e `Ordem` (continuam existindo internamente: slug gerado auto pelo `slugify(name)`, sort_order default `0`).
- `UF` / `Cidade` **principal**: trocar Inputs por Selects (IBGE).
- **Novo bloco "Regiões atendidas"**: lista dinâmica de pares UF+Cidade (Selects IBGE) com botões adicionar/remover. A primeira é a cidade principal. Salvar em coluna nova `service_areas jsonb` (array `[{state,city}]`).
- **Logo**: adicionar dica "Tamanho ideal: 200x200px (quadrado, fundo transparente)".
- **Banner**: novo upload de imagem (bucket `brand-logos` ou `launches`), dica "Tamanho ideal: 1200x300px". Salvar em `banner_url`.
- **Remover** campo `Descrição da modalidade`.
- Substituir único `Percentuais / Comissão` por **dois pares**:
  - `Percentuais / Comissão — Indicação de Locatário` + Select "Quando ocorre" (`No 1º Pagamento` | `Recorrente`).
  - `Percentuais / Comissão — Indicação de Proprietário` + Select "Quando ocorre" (`No 1º Pagamento` | `Recorrente`).
  - Salvar em colunas novas: `commission_tenant_text`, `commission_tenant_when`, `commission_owner_text`, `commission_owner_when`. Manter `commission_text` por compatibilidade (não exibir).
- **Novo campo Website** (`website_url`, URL).

### 3) Migration de banco

Adicionar à tabela `rental_partners`:
- `banner_url text`
- `website_url text`
- `commission_tenant_text text`
- `commission_tenant_when text` (valores: `FIRST_PAYMENT` | `RECURRING`)
- `commission_owner_text text`
- `commission_owner_when text`
- `service_areas jsonb default '[]'::jsonb` (array de `{state, city}`)

Backfill `service_areas` com `[{state, city}]` existentes para registros já criados.

### 4) types.ts

Será regenerado automaticamente após a migration.

## Observações

- O usuário pediu que o parceiro cadastre as próprias informações sem ver Slug/Ordem — por ora o cadastro continua sendo no admin (tela atual já permite que o `owner` edite via RLS); apenas escondemos esses campos do modal. Um portal de auto-atendimento do parceiro fica para depois.
- "Tipo de imóvel" no formulário do proprietário **mantém** a lista atual (já é select).
