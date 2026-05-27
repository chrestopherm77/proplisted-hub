
# Módulo "Alugue em Parceria"

Estrutura inspirada no módulo Financiamento, mas com lista de imobs parceiras filtráveis por cidade/UF. O corretor escolhe uma imob, escolhe se está com o **locatário** ou com o **proprietário**, e isso abre o WhatsApp da imob com mensagem pré-formatada com os dados do corretor (+ dados do imóvel quando aplicável).

## 1. Banco de dados

Nova tabela `rental_partners`:

- `name`, `slug`
- `logo_url`, `description` (texto curto sobre a modalidade)
- `commission_text` (ex.: "50% sobre 1ª locação")
- `whatsapp_phone` (12 dígitos, padrão do projeto)
- `state` (UF), `city`
- `is_active`, `sort_order`
- `owner_user_id` (uuid, opcional — para a imob editar o próprio banner no futuro)

RLS:
- Público autenticado pode ler ativos.
- `MASTER_ADMIN` faz tudo.
- Dono (`owner_user_id = auth.uid()`) pode editar a própria linha (UPDATE).

GRANTs padrão (`anon` read dos ativos via página interna não é necessário — somente `authenticated`).

## 2. Página `/alugue-em-parceria`

Layout autenticado (`<Layout>`), em `src/pages/RentalPartnership.tsx`.

Componentes:
- Cabeçalho com título + subtítulo + botão **"Quero me tornar uma imob parceira"** → abre `https://wa.me/5543996102805?text=...` com texto padrão de interesse.
- Filtro UF + Cidade (IBGE, mesmo hook `useIBGELocation` já usado).
- Grid de cards (banners) das imobs ativas, filtradas por UF/cidade. Cada card mostra: logo, nome, cidade/UF, descrição curta, percentual/comissão, e dois botões:
  - **"Estou com o locatário"**
  - **"Estou com o proprietário"**

Fluxo de clique:
- **Locatário**: sem formulário extra. Abre WhatsApp da imob com mensagem:
  ```
  *Parceria de Locação — Estou com o LOCATÁRIO*
  Olá! Tenho um locatário interessado em imóveis da sua carteira.
  Corretor: {nome}
  Telefone: {phone}
  CRECI: {creci/uf} (se houver)
  Vamos conversar sobre a parceria?
  ```
- **Proprietário**: abre um `Dialog` com formulário "básico":
  - Tipo de imóvel (Select: Casa, Apartamento, Sala, Galpão, Terreno, Outro)
  - UF + Cidade + Bairro
  - Valor pretendido do aluguel (currency mask)
  - Dormitórios
  - Observações (textarea)
  Ao enviar, abre WhatsApp da imob com mensagem formatada incluindo dados do imóvel + dados do corretor.

Os dados do corretor (`name`, `phone`, `creci`, `creci_uf`) vêm do `profiles` do usuário logado (mesmo padrão do Financing).

## 3. Navegação

- Adicionar rota `/alugue-em-parceria` em `src/App.tsx`.
- Adicionar item no `AppSidebar.tsx` (grupo onde está Financiamento), ícone `Handshake` (lucide).
- Adicionar entrada equivalente no `MobileMenu.tsx`.
- Adicionar `alugue-em-parceria` à lista de slugs reservados (funções `validate_landing_page_slug` e `validate_public_video_slug`).

## 4. Painel Admin — gestão das parceiras

Nova página em `src/components/admin/RentalPartnersManagement.tsx` (registrada em `src/pages/Admin.tsx` e `AdminLayout.tsx` no grupo "Conteúdo", ícone `Handshake`):

Tabela com colunas: Nome, Cidade/UF, WhatsApp, Comissão, Ativo, Ações.

Ações:
- **Novo / Editar** (Dialog com todos os campos da tabela).
- Toggle Ativo.
- Excluir.
- Campo opcional "E-mail do dono" → ao salvar, busca o `profiles.id` por e-mail e seta `owner_user_id` (para a imob editar depois).

Upload de logo usa o bucket público existente `brand-logos`.

## 5. Detalhes técnicos

- WhatsApp: formatar o número para 12 dígitos (regra do projeto) antes de montar `wa.me/{phone}?text=...`.
- O botão "Quero me tornar uma imob parceira" usa o número fixo `5543996102805` (12 dígitos, sem o 9).
- Filtro de cidade é case/acento-insensitive no front (já temos imóveis usando normalização similar).
- Sem edge function — tudo client-side, leitura direta da tabela.

## Entregáveis

- Migration: `rental_partners` + RLS + GRANTs + atualização dos validadores de slug.
- Página pública: `src/pages/RentalPartnership.tsx` (+ componente do card e dialog do proprietário).
- Página admin: `src/components/admin/RentalPartnersManagement.tsx`.
- Wiring de rotas e menus: `App.tsx`, `AppSidebar.tsx`, `MobileMenu.tsx`, `Admin.tsx`, `AdminLayout.tsx`.
