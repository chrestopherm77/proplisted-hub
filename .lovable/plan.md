

## Portal de Imóveis: Zona + Match automático com Leads

### 1. Campo "Zona" no formulário de publicação

`src/pages/NewProperty.tsx` + tabela `properties`:
- Migração: adicionar coluna `zone TEXT` em `properties`.
- Atualizar a função `get_public_property` para retornar `zone` também.
- Form: novo `<Select>` "Zona" no card "Informações principais" com as opções padrão do projeto: **Norte / Sul / Leste / Oeste / Centro / Rural** (mesmas usadas em `Launches.tsx` e `PropertySearches.tsx`).
- Exibir a zona nos cards (`PropertyCard.tsx`) e no detalhe (`PropertyDetail.tsx` / `PublicPropertyLP.tsx`) ao lado do bairro.

### 2. Match Lead → Imóvel publicado (notificação WhatsApp)

**Quando dispara**: sempre que um lead é confirmado e ativado no `mega-webhook` (mesmo ponto onde já chama `notify-new-lead`).

**Como funciona**:
1. Após ativar o lead, o webhook chama uma nova edge function `notify-property-match` (fire-and-forget, igual o padrão atual).
2. A função recebe `leadId` + `formData` + `city` + `uf`.
3. Extrai do `form_data` do lead:
   - **Cidade** (já vem)
   - **Faixa de orçamento**: `buy.budgetMin` / `buy.budgetMax` (BUY), `rent.maxRent` (RENT), `build.budget` (BUILD), `sell.expectedValue` (SELL — dispara para corretores que tenham imóvel parecido para oferecer permuta? **vamos focar só em BUY e RENT** que faz match direto com publicação).
   - **Tipo de imóvel** (opcional, se vier no flow).
4. Busca em `properties` todos os anúncios `is_active = true` na **mesma cidade**, e filtra os que se encaixam:
   - **Lead BUY** → bate com `properties` que tenham `operation_type IN ('SALE','BOTH')` E `price_sale BETWEEN budgetMin AND budgetMax` (se faltar min/max, usa só o lado preenchido).
   - **Lead RENT** → bate com `properties` que tenham `operation_type IN ('RENT','BOTH')` E `price_rent <= maxRent`.
5. Para cada imóvel que bater, busca o telefone do dono (`properties.user_id` → `profiles.phone`) e o telefone do **dono original NÃO** — apenas o dono do anúncio. (Afiliados não recebem nesse momento; só o publicador original.)
6. Envia WhatsApp via **MegaAPI** (mesmo padrão de `notify-alert-match`):
   ```text
   🎯 Novo lead com perfil pro seu imóvel!
   
   Imóvel: {title} (Ref: {reference_code})
   Cidade: {city}
   
   Acabou de chegar um lead em {city} interessado em {COMPRAR/ALUGAR}
   na faixa de {budget}.
   
   Acesse o Marketplace pra ver os detalhes:
   https://leadbay.com.br/leads/{leadId}
   ```
7. Deduplicação: limita 1 mensagem por usuário por lead (se o mesmo corretor tem 3 imóveis que batem, manda só 1 mensagem listando o primeiro/mais recente — evita spam).

**Edge function nova**: `supabase/functions/notify-property-match/index.ts`
- Recebe POST com `{ leadId, city, uf, intention, formData }`.
- Reutiliza helpers `normalizeWhatsAppPhone` e `sendMegaMessage` (copiados do `notify-alert-match`).
- Valida com Zod.
- Loga matches encontrados e mensagens enviadas.

**Chamada**: adicionar bloco fire-and-forget em `mega-webhook/index.ts` logo depois do `notify-new-lead` (linhas ~99-121), com a mesma estrutura.

### 3. Detalhes técnicos

- **Migração SQL**:
  ```sql
  ALTER TABLE public.properties ADD COLUMN zone TEXT;
  -- + atualizar função get_public_property para incluir zone no jsonb
  ```
- Atualizar `src/integrations/supabase/types.ts` é automático.
- Form validação: `zone` é opcional (igual bairro hoje).
- `propertyUtils.ts`: exportar `ZONE_OPTIONS = ['Norte','Sul','Leste','Oeste','Centro','Rural']` para reuso.
- A nova edge function precisa ser declarada como pública em `supabase/config.toml` se quisermos `verify_jwt = false` (vamos manter o padrão Lovable e validar via service role no body).

### 4. O que NÃO muda

- Sistema de afiliação, download de fotos, copiar link, marca pessoal.
- Notificação por e-mail para todos (`notify-new-lead`) continua igual — o WhatsApp por match é **adicional**.
- Tabela `leads` não é alterada.
- LP pública/detalhe interno só ganham a exibição da zona; resto inalterado.

### Resultado

- Ao publicar um imóvel, o corretor seleciona a Zona (Norte/Sul/Leste/Oeste/Centro/Rural).
- Quando um lead novo entra (e é confirmado no WhatsApp), o sistema confere se a cidade + faixa de preço dele bate com algum imóvel publicado no Portal.
- O corretor dono do imóvel recebe automaticamente uma mensagem no WhatsApp avisando que tem um lead compatível esperando no Marketplace.

