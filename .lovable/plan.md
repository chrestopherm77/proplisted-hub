

# Plano: Ofertas com Link, Notificação WhatsApp e Alertas de Filtro

## Resumo

Três funcionalidades no Balcão de Parcerias:
1. **Oferta com link**: ao clicar "Enviar Oferta", abre modal com opção de WhatsApp + campo para colar link do anúncio. Na tela de detalhes, listar ofertas recebidas (nome + link).
2. **Notificação WhatsApp ao dono da procura**: quando alguém envia uma oferta, o sistema dispara mensagem via Mega API informando que há nova oferta.
3. **Salvar filtro como Alerta**: botão que salva os filtros atuais. Quando uma nova procura é criada e se encaixa, o corretor recebe WhatsApp.

---

## 1. Migração de banco de dados

### Alterar tabela `property_search_offers`
- Adicionar coluna `offer_link` (text, nullable) — link do anúncio
- Adicionar coluna `offer_name` (text, nullable) — nome de quem ofertou (cache para exibir sem join)

### Nova tabela `property_search_alerts`
```sql
CREATE TABLE public.property_search_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filters jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.property_search_alerts ENABLE ROW LEVEL SECURITY;
-- Users manage own alerts
CREATE POLICY "Users can manage own alerts" ON public.property_search_alerts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Admins can view all
CREATE POLICY "Admins can view all alerts" ON public.property_search_alerts FOR SELECT TO public USING (has_role(auth.uid(), 'MASTER_ADMIN'));
```

---

## 2. Edge Function `notify-offer-whatsapp`

Quando o corretor envia uma oferta:
- Recebe: `searchId`, `offerUserName`, `offerLink`
- Busca o `user_id` da procura → busca `phone` e `name` do dono via profiles
- Monta mensagem: "Olá [nome]! Alguém enviou uma oferta na sua procura de [tipo] em [cidade]. [Link se houver]"
- Dispara via Mega API (mesmo padrão do `send-financing-whatsapp`)

## 3. Edge Function `notify-alert-match`

Chamada quando uma nova procura é criada:
- Busca todos os alertas ativos
- Compara filtros (state, city, property_type, operation_type, faixa de preço) com a nova procura
- Para cada match, busca o telefone do corretor e envia WhatsApp via Mega API

---

## 4. Frontend

### `PropertySearches.tsx`
- **Botão "Enviar Oferta"**: ao clicar, abre modal com:
  - Botão "Chamar no WhatsApp" (comportamento atual)
  - Campo de texto "Link do seu anúncio" + botão "Enviar Link"
  - Ao enviar link, salva na `property_search_offers` com `offer_link` e chama `notify-offer-whatsapp`
- **Botão "Salvar como Alerta"** nos filtros: salva os filtros atuais na tabela `property_search_alerts`

### `PropertySearchDetail.tsx` e Modal de detalhes
- Abaixo dos detalhes, seção "Ofertas Recebidas": lista com nome do corretor e link clicável (se houver)
- Busca ofertas da tabela `property_search_offers` com join no profiles para nome

### `NewPropertySearch.tsx`
- Após criar a procura com sucesso, chamar `notify-alert-match` passando os dados da nova procura

---

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | `offer_link`, `offer_name` em `property_search_offers` + tabela `property_search_alerts` |
| `supabase/functions/notify-offer-whatsapp/index.ts` | Nova Edge Function |
| `supabase/functions/notify-alert-match/index.ts` | Nova Edge Function |
| `src/pages/PropertySearches.tsx` | Modal de oferta com link + botão Salvar Alerta |
| `src/pages/PropertySearchDetail.tsx` | Listar ofertas recebidas |
| `src/pages/NewPropertySearch.tsx` | Chamar `notify-alert-match` ao criar |

