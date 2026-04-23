

## Limites por plano (Etapa 2) + ajustes

### 1. Custo de criativo: 10 créditos cada

A geração de criativo passa a debitar **10 créditos por imagem** (não conta no limite mensal — esses são dois gates separados):

- O usuário precisa ter ≥10 créditos disponíveis OU não ter atingido a cota do plano para gerar.
- **Função RPC `consume_credits_for_creative(p_user_id, p_creative_id, p_amount)`** valida saldo, debita `credit_balance`, registra em `credit_transactions` (novo `type = 'CREATIVE_GENERATION'`).
- Chamada no `generate-creative-image` antes de invocar a Gemini. Se falhar → marca criativo como `FAILED` com mensagem "Créditos insuficientes" e devolve erro para o front.
- No card do criativo (StepResult / GenerateCreative) e na aba "Gerar criativo" mostra: "Cada criativo custa **10 créditos**. Saldo atual: X."

### 2. Helper central de plano + limites

**Hook `useSubscriptionLimits()`** (`src/hooks/useSubscriptionLimits.ts`):
- Carrega assinatura ativa do usuário + features do plano + saldo de créditos.
- Calcula uso atual:
  - `properties_used` = `properties` ativos do usuário
  - `creatives_used_month` = `creatives` do mês corrente (`created_at >= date_trunc('month', now())`)
  - `partnership_requests_used` = `property_searches` ativos do usuário
  - `partnership_offers_used_month` = `property_search_offers` do mês corrente
- Retorna `{ plan, features, usage, can(resource): { allowed, reason, limit, used, isUnlimited } }`.
- Sem assinatura ativa → fallback para plano `CONEXÃO` (free).

### 3. Aplicar bloqueios

**Imóveis no portal** — `src/pages/NewProperty.tsx`:
- No `useEffect` inicial, checa `can('portal_properties')`. Se atingiu o limite, mostra modal/tela "Limite de imóveis atingido — faça upgrade" com CTA para `/planos`. Bloqueia o botão Salvar.

**Solicitação de parceria (criar procura no Balcão)** — `src/pages/NewPropertySearch.tsx`:
- Mesmo padrão: ao montar, valida `can('partnership_requests')`. Bloqueia salvar se atingido.

**Envio de oferta no Balcão** — `src/pages/PropertySearches.tsx` + `PropertySearchDetail.tsx`:
- Antes de cada `handleWhatsAppOffer` / `handleSendLink`, chama `can('partnership_offers')`. Se atingiu, toast "Limite de ofertas mensais atingido. Faça upgrade." e abre modal com CTA `/planos`.
- Botão "Enviar Oferta" mostra tooltip com "X de Y ofertas usadas no mês" quando próximo do limite.

**Geração de criativo** — `src/components/criativos/GenerateCreative.tsx`:
- Antes de chamar `handleGenerate`, valida dois gates:
  1. `can('creatives_per_month')` — limite mensal do plano.
  2. `credit_balance >= 10` — saldo de créditos.
- Se algum falha, mostra dialog específico com motivo e CTA (planos ou comprar créditos).

**Componente reutilizável** `src/components/plans/PlanLimitDialog.tsx`:
- Dialog padronizado mostrando "Você atingiu o limite do plano X (Y de Y usados). Faça upgrade para continuar." + botão para `/planos`.

### 4. Indicadores de uso

**Card "Minha Assinatura"** (`MySubscriptionCard.tsx`) ganha barras de progresso por recurso:
- Imóveis no portal: 2/3
- Criativos no mês: 1/1
- Solicitações de parceria: 0/1
- Ofertas de parceria no mês: 3/5
- Itens com `-1` (ilimitado) mostram "Ilimitado" ao invés de barra.

### 5. Ajustes solicitados nos cards de plano

**ESSENCIAL** já está com `training_level: intermediate` no banco — apenas ajustar a bullet do `feature_list` se necessário (já está "Básicos e Intermediários" ✅).

**ELITE** atualmente está com `training_level: basic` e bullet "Acesso a treinamentos Básicos". Trocar para:
- `features.training_level = 'intermediate'`
- `feature_list` substituir "Acesso a treinamentos Básicos" por "Acesso a treinamentos Básicos e Intermediários".

**PERFORMANCE**: bullet permanece "Acesso a treinamentos Básicos" (sem mudança).

Update via `UPDATE subscription_plans` (operação de dados, sem migration).

### 6. Edge function nova: `consume_credits_for_creative` (RPC SQL)

Migration cria função SECURITY DEFINER:
```text
input: p_user_id uuid, p_creative_id uuid, p_amount int (default 10)
- lock profile FOR UPDATE
- if credit_balance < amount → return {error:'Créditos insuficientes', balance}
- decrement credit_balance
- insert credit_transactions (type='CREATIVE_GENERATION', credits_used=amount, lead_id=null)
- return {success:true, new_balance}
```

`generate-creative-image` chama essa RPC com service role logo após validar creative; se falhar, marca FAILED e retorna 402.

### 7. Arquivos afetados

**Migration**:
- Nova função `consume_credits_for_creative`
- `UPDATE subscription_plans` para o ELITE (training intermediário)

**Backend**:
- `supabase/functions/generate-creative-image/index.ts` — debitar créditos antes da geração

**Frontend (novos)**:
- `src/hooks/useSubscriptionLimits.ts`
- `src/components/plans/PlanLimitDialog.tsx`

**Frontend (editar)**:
- `src/pages/NewProperty.tsx` — gate de imóveis
- `src/pages/NewPropertySearch.tsx` — gate de solicitação de parceria
- `src/pages/PropertySearches.tsx` + `src/pages/PropertySearchDetail.tsx` — gate de envio de oferta
- `src/components/criativos/GenerateCreative.tsx` — gate de criativo + aviso "10 créditos"
- `src/components/profile/MySubscriptionCard.tsx` — barras de uso
- `src/integrations/supabase/types.ts` — auto-regen após migration

### O que NÃO entra agora

- **Hot Seat** (`hot_seat_per_month`) — não existe módulo de hot seat ainda. Limite fica gravado no plano para uso futuro.
- **Leads inclusos** (`leads_included`) — atualmente lead é comprado avulso com créditos. A entrega de "2 leads grátis no Performance / 5 no Elite" exige fluxo de seleção próprio, fica para próxima etapa.
- **Treinamentos** (`training_level`) — não há módulo de cursos no app ainda; gating apenas exibido no card.
- **Pró-rata** em mudança de plano (já documentado na Etapa 1).

