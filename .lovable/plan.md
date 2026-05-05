## Ajustes nos planos

### Mudanças solicitadas
1. Renomear o plano **Performance (R$ 79,90)** para **Elite**
2. Remover o plano antigo **Elite (R$ 149,90)** (todos os ciclos: mensal/trim/anual)
3. **Essencial** vira ilimitado em: solicitações de parceria, ofertas de parceria e imóveis no portal (créditos e criativos seguem 30/mês e 3/mês)
4. Novo **Elite (R$ 79,90)**: 150 créditos/mês, sem leads inclusos, sem Hot Seat, **com Site Personalizado**
5. Onde ficava o 4º card (antigo Elite 149), mostrar um card **"Quero ser parceiro"** que abre WhatsApp `https://wa.me/5516992456258`

### Banco (migration SQL)
- Apagar todas as linhas com `slug` ou `parent_slug = 'elite'` (planos R$ 149,90 mensal/trim/anual) — não há assinaturas ativas, seguro.
- `UPDATE subscription_plans` para renomear `performance*` → `elite*` (slugs `elite`, `elite-trimestral`, `elite-anual`; `parent_slug='elite'`; `name` → "ELITE", "ELITE Trimestral", "ELITE Anual").
- Atualizar features/feature_list do **Elite** (antigo Performance) por ciclo:
  - `monthly_credits`: 150 (mensal), 450 (trimestral = 150×3), 1800 (anual = 150×12)
  - `features`: zerar `leads_included` e `hot_seat_per_month`; manter `creatives_per_month: 15`; manter ilimitados.
  - `feature_list`: remover "Hot Seat 2x mês" e "X leads inclusos"; adicionar "Site Personalizado".
- Atualizar **Essencial** (todos os ciclos):
  - `features.partnership_requests`, `partnership_offers`, `portal_properties` → `-1`
  - `feature_list`: substituir entradas limitadas por "Solicitações de parceria ilimitadas", "Ofertas de parceria ilimitadas", "Imóveis no portal ilimitados".
- Atualizar `home_page_content.content->'plans_section'->'plans'`:
  - 3º card vira o novo Elite (slug `elite`, R$ 79,90, 150 créditos, lista atualizada com "Site Personalizado").
  - 4º card vira `{ slug: 'partner', name: 'Quero ser parceiro', cta: 'Falar no WhatsApp', ... }`.
  - 2º card (Essencial) atualizado com itens ilimitados.

### Código
- `src/components/admin/home-page/types.ts`
  - Trocar `HomePlan.slug` para `'conexao' | 'essencial' | 'elite' | 'partner'` e `PLAN_SLUGS`.
  - Atualizar `DEFAULT_HOME_CONTENT.plans_section.plans` (Essencial ilimitado; Elite 79,90 com Site Personalizado; 4º card "Quero ser parceiro" com cta `Falar no WhatsApp`).
- `src/pages/Index.tsx`
  - `isPopular`: agora `slug === 'elite'`.
  - `isHighlight`: remover (ou manter false).
  - No `.map` dos planos, se `plan.slug === 'partner'`, renderizar card especial sem preço/lista (ícone Handshake + texto curto + botão "Falar no WhatsApp" abrindo `https://wa.me/5516992456258` em nova aba). Os outros 3 seguem o template atual.
- `src/pages/Planos.tsx`
  - `paidParents` → `['essencial', 'elite']` (remove `performance`); como agora só há 3 planos pagos visíveis (conexão + essencial + elite), adicionar um 4º card estático "Quero ser parceiro" idêntico ao da home na grade `lg:grid-cols-4`.
  - `isPopular` muda para `parent === 'elite'`.
- `src/components/admin/landing-page/types.ts`
  - Defaults dos planos da LP (linhas 298 e 309): mesmas atualizações do home (Essencial ilimitado; Elite 79,90 com Site Personalizado; 4º vira "Quero ser parceiro").

### Detalhes técnicos
- WhatsApp link gerado direto como `https://wa.me/5516992456258` (12 dígitos, segue regra do projeto).
- Card "partner" não chama `handlePlanSelect`; usa `<a target="_blank" rel="noopener">`.
- Não mexer em `subscription_plans.parent_slug = 'performance'` após o rename (vai virar `elite`); índice unique em (slug) requer apagar elite antigo antes do update — a migration faz nessa ordem.
- Sem alterações em edge functions: `create-subscription` opera por `plan_id`, então o rename não quebra o fluxo.
