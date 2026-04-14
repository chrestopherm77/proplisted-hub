

# Plano: Correções e Melhorias no Balcão de Parcerias

## Problemas Identificados

1. **Loading infinito ao enviar link**: A Mega API retornou erro 524 (timeout Cloudflare). A função retorna `{success: true}` mesmo quando a Mega falha, mas o frontend pode estar travando na chamada fetch. O problema real é que a chamada `await fetch(notify-offer-whatsapp...)` pode demorar e o `setSendingLink(false)` só roda depois dela.
2. **WhatsApp não chegou**: Logs confirmam `Mega API error: 524` — a Mega estava com timeout naquele momento. A função não faz retry.
3. **Ofertas visíveis só para o criador**: Linha 690 do `PropertySearches.tsx` tem `selectedSearch.user_id === user!.id` como condição. RLS também restringe SELECT apenas ao dono da procura e ao dono da oferta.
4. **Filtro de Zona é texto livre** no mural (deveria ser Select como no formulário de criação).
5. **Valores sem máscara monetária** nos filtros do mural.
6. **Botão "Salvar filtro" só aparece quando há filtros ativos** — falta interface de "Meus filtros salvos" com opção de excluir.
7. **Salvar Alerta não abre modal com filtros** — salva direto os filtros ativos da tela.

---

## Correções

### 1. Migração SQL — Visibilidade das ofertas para todos
- Adicionar nova RLS policy em `property_search_offers` para permitir SELECT a todos os usuários autenticados (qualquer MASTER_ADMIN já pode, mas agora qualquer autenticado com acesso ao módulo também verá).

```sql
CREATE POLICY "Authenticated can view all offers"
  ON public.property_search_offers
  FOR SELECT TO authenticated
  USING (true);
```

### 2. Edge Function `notify-offer-whatsapp` — Retry e resiliência
- Adicionar retry (1 tentativa extra) para erros 5xx da Mega API.
- Adicionar logging mais detalhado.

### 3. Frontend `PropertySearches.tsx` — Múltiplas correções

**a) Loading infinito ao enviar link**:
- Mover a chamada `notify-offer-whatsapp` para ser fire-and-forget (sem `await`), para que o modal feche imediatamente após salvar a oferta no banco.

**b) Ofertas visíveis para todos no modal de detalhes**:
- Remover a condição `selectedSearch.user_id === user!.id` da seção "Ofertas Recebidas".
- Carregar ofertas para qualquer procura ao abrir o modal de detalhes (não apenas para procuras do próprio usuário).

**c) Filtro de Zona como Select**:
- Trocar o `<Input>` de zona por um `<Select>` com as opções: Norte, Sul, Leste, Oeste, Centro, Rural (mesmas do formulário de criação).

**d) Valores com máscara monetária**:
- Aplicar a mesma função `formatCurrency` nos campos de preço mínimo e máximo dos filtros.

**e) Botão "Salvar filtro como Alerta" fixo + "Meus filtros salvos"**:
- Mover o botão para ficar sempre visível (não condicionado a `hasActiveFilters`).
- Ao clicar, abrir um modal com os mesmos campos de filtro (Estado, Cidade, Tipo, Objetivo, Zona como Select, Bairro opcional, Valor mín/máx com máscara) + botão "Salvar".
- Adicionar seção "Meus Alertas Salvos" na sidebar ou abaixo do botão, listando os alertas do usuário com botão de excluir (delete da tabela `property_search_alerts`).

### 4. `PropertySearchDetail.tsx` — Listar ofertas
- Adicionar seção "Ofertas Recebidas" (para todos os usuários, não só o dono).
- Buscar ofertas de `property_search_offers` para a procura atual e listar nome + link.

---

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Nova policy SELECT em `property_search_offers` para autenticados |
| `supabase/functions/notify-offer-whatsapp/index.ts` | Retry para erros 5xx |
| `src/pages/PropertySearches.tsx` | Fire-and-forget na notificação, ofertas visíveis para todos, zona como Select, valores com máscara, modal de salvar alerta, lista de "Meus Alertas" |
| `src/pages/PropertySearchDetail.tsx` | Seção de ofertas recebidas visível para todos |

