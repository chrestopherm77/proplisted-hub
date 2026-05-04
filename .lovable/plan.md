## Mapeamento de Log do Usuário (Admin)

Criar uma nova seção no admin que registra e exibe um histórico cronológico de atividades de cada corretor no sistema (cadastro, primeiros passos, balcão, publicações, etc.).

### Como vai funcionar

**Tela:** novo item no menu admin "**Atividade dos Usuários**" (`/admin/user-activity`).

Layout em duas partes:
1. **Lista de corretores** (esquerda) — busca por nome/e-mail/telefone, mostra cada usuário com nº total de eventos e data da última atividade.
2. **Timeline do usuário selecionado** (direita) — clica num corretor e abre a linha do tempo cronológica reversa: tipo de evento, descrição amigável, e horário (relativo + absoluto no hover).

### Eventos rastreados

| Categoria | Quando registra |
|---|---|
| `SIGNUP` | Ao concluir cadastro |
| `LOGIN` | Já existe (`login_history`), agregado na timeline |
| `ONBOARDING_VIEW` | Acessa /primeiros-passos |
| `LEAD_PURCHASE` | Compra um lead (Balcão) |
| `CREDIT_PURCHASE` | Compra créditos |
| `SUBSCRIPTION` | Assina/cancela plano |
| `PROPERTY_PUBLISHED` | Publica imóvel no Portal |
| `LAUNCH_PUBLISHED` | Publica lançamento |
| `PROPERTY_SEARCH_CREATED` | Cria captação no Balcão |
| `CREATIVE_GENERATED` | Gera criativo |
| `LEAD_ALERT_CREATED` | Cria alerta de lead |
| `PROFILE_COMPLETED` | Completa perfil |
| `SUPPORT_TICKET` | Abre chamado |

### Backfill (usuários já cadastrados)

Migration popula a tabela com eventos históricos a partir de:
- `profiles.created_at` → SIGNUP
- `login_history` → LOGIN
- `purchases` → LEAD_PURCHASE
- `credit_purchases` → CREDIT_PURCHASE
- `properties.created_at` → PROPERTY_PUBLISHED
- `launches.created_at` → LAUNCH_PUBLISHED
- `property_searches.created_at` → PROPERTY_SEARCH_CREATED
- `creatives.created_at` → CREATIVE_GENERATED
- `lead_alerts.created_at` → LEAD_ALERT_CREATED

Assim a tela já nasce com histórico completo de quem está na base.

---

### Detalhes técnicos

**1. Nova tabela `user_activity_log`**
```
id uuid PK
user_id uuid (índice)
event_type text (índice)
event_label text  -- texto pronto pra exibir em PT-BR
metadata jsonb    -- ex: { lead_id, property_id, amount }
created_at timestamptz default now() (índice DESC)
```
- RLS: SELECT/INSERT/DELETE apenas para `MASTER_ADMIN`.
- INSERT também permitido pelo próprio usuário no seu `user_id` (pra logging client-side).

**2. Triggers automáticos** (registro futuro sem mexer em código de feature):
- `AFTER INSERT ON profiles` → SIGNUP
- `AFTER INSERT ON login_history` → LOGIN
- `AFTER INSERT ON purchases` (status PAID) → LEAD_PURCHASE
- `AFTER INSERT ON credit_purchases` (status PAID) → CREDIT_PURCHASE
- `AFTER INSERT ON properties` → PROPERTY_PUBLISHED
- `AFTER INSERT ON launches` → LAUNCH_PUBLISHED
- `AFTER INSERT ON property_searches` → PROPERTY_SEARCH_CREATED
- `AFTER INSERT ON creatives` → CREATIVE_GENERATED
- `AFTER INSERT ON lead_alerts` → LEAD_ALERT_CREATED
- `AFTER UPDATE ON profiles` quando `profile_completed` vira true → PROFILE_COMPLETED

**3. Logging client-side** (eventos que não têm row no banco):
- `ONBOARDING_VIEW` em `PrimeirosPassos.tsx` (insert na primeira visualização da sessão)
- `SUPPORT_TICKET` no `SupportChatWidget` quando abre chamado

**4. Backfill** — bloco SQL único na mesma migration que insere os históricos descritos acima.

**5. UI** — `src/components/admin/UserActivityLog.tsx`:
- Query 1: lista de usuários com `count(*)` e `max(created_at)` agregando `user_activity_log` + join `profiles`.
- Query 2: timeline do user selecionado (paginada, 100 por página).
- Ícone por tipo, cor por categoria, busca, filtro por tipo de evento.
- Realtime opcional via canal `user_activity_log`.

**6. Plumbing**
- Adicionar `'user-activity'` ao type `Section` e `COMPONENTS` em `src/pages/Admin.tsx`.
- Adicionar rota `/admin/user-activity` em `src/App.tsx`.
- Adicionar item "Atividade dos Usuários" em `ADMIN_NAV` (grupo "Visão Geral", ícone `Activity` ou `History`).

### Arquivos criados/editados
- **Migration nova**: tabela + RLS + 10 triggers + backfill.
- **Criar** `src/components/admin/UserActivityLog.tsx`.
- **Editar** `src/pages/Admin.tsx`, `src/App.tsx`, `src/components/admin/AdminLayout.tsx`.
- **Editar** `src/pages/PrimeirosPassos.tsx` (log ONBOARDING_VIEW).
- **Editar** `src/components/support/SupportChatWidget.tsx` (log SUPPORT_TICKET na criação).
