

## Ajustes Portal de Imóveis + Minha Marca

### 1. Form: esconder campo de valor conforme operação

`src/pages/NewProperty.tsx` — card "Valores":
- **Venda**: mostra Preço de venda + Condomínio + IPTU
- **Aluguel**: mostra Valor do aluguel + Condomínio + IPTU
- **Venda e Aluguel**: mostra todos
- Validação ajustada: só exige `priceSale` se operação inclui venda; só exige `priceRent` se inclui aluguel.

### 2. Galeria mobile: lightbox com swipe

`src/components/portal/PropertyGallery.tsx`:
- Adicionar `Dialog` em fullscreen ao clicar na foto principal ou thumbnail.
- Imagem com `object-contain` (sem cortar).
- Navegação: botões ← →, suporte a teclado (Arrow keys), e **swipe** via `onTouchStart`/`onTouchEnd` (threshold 50px).
- Contador "X / Y" no topo, botão de fechar.

### 3. Background da imagem enviada

- Copiar `user-uploads://ChatGPT_Image_10_de_abr._de_2026_11_36_30-3.png` para `public/images/portal-bg.jpg`.
- Aplicar como background fixo (cobrindo toda viewport, `bg-cover bg-center bg-no-repeat`) em:
  - `src/pages/PropertyDetail.tsx` (tela "Anunciar Imóvel" / detalhe interno)
  - `src/pages/PublicPropertyLP.tsx` (LP pública compartilhada)
- Cards/conteúdo ficam em cima com leve `bg-background/80 backdrop-blur-sm` pra manter legibilidade.

### 4. "Minha Marca" no menu de perfil

**Banco** — nova tabela `user_brands`:
- `id`, `user_id` (unique), `company_name`, `logo_url`, `primary_color` (hex), `secondary_color` (hex), `created_at`, `updated_at`
- RLS: dono lê/escreve a própria; SELECT público via RPC `get_public_property` (já vai retornar a marca junto).
- Bucket reutilizado: pasta `brands/{user_id}/logo.png` no bucket `properties` (já público).

**UI** — novo card em `src/pages/Profile.tsx`:
- Componente `src/components/profile/MyBrandCard.tsx`
- Campos: upload de logo (preview), nome da imobiliária, color picker primário, color picker secundário.
- Botão Salvar grava em `user_brands` (upsert por `user_id`).

**Aplicação na LP pública** — `src/pages/PublicPropertyLP.tsx`:
- RPC `get_public_property` atualizada para fazer `LEFT JOIN user_brands` no `contact_user_id` (dono OU afiliado conforme token) e devolver `brand_logo`, `brand_name`, `brand_primary_color`, `brand_secondary_color`.
- Detalhes leves usando as cores:
  - Borda do card de contato com a cor primária
  - Badge do preço com bg da cor primária
  - Botão WhatsApp com bg da cor secundária (fallback: verde padrão)
  - Logo + nome da imobiliária acima do bloco "Anunciado por" (se existir)
- Sem cores → mantém visual padrão.

### 5. Detalhes técnicos

- Migração SQL: criar `user_brands` + atualizar a função `get_public_property` para retornar campos da marca.
- `src/integrations/supabase/types.ts` será regenerado automaticamente.
- Sem mudança no fluxo de afiliação — só a aparência da LP muda conforme quem está mostrando o imóvel.

### O que NÃO muda

- Estrutura das tabelas `properties` / `property_affiliates`.
- Rotas existentes.
- Sistema de download de fotos (.zip), copiar link, anunciar.

