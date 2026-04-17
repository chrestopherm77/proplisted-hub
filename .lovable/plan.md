
## CRM Kanban em "Meus Leads"

Transformar `/my-leads` num kanban arrastável com 5 colunas, anotações por lead e botão WhatsApp direto.

### Etapas (colunas)
`NOVO` → `EM_CONVERSA` → `AGENDADO` → `VENDIDO` → `PERDIDO`

Todo lead comprado entra automaticamente em **NOVO**. O usuário arrasta entre colunas (drag & drop) ou move via dropdown no card (fallback mobile).

### Mudanças no banco

**Nova tabela `lead_crm_status`** — um registro por (user_id, purchase_id):
- `id` uuid pk
- `user_id` uuid (RLS: dono apenas)
- `purchase_id` uuid (referência lógica à purchases.id)
- `lead_id` uuid
- `stage` text default `'NOVO'` (check: NOVO/EM_CONVERSA/AGENDADO/VENDIDO/PERDIDO)
- `notes` text nullable
- `updated_at` timestamptz
- unique (user_id, purchase_id)

RLS: `auth.uid() = user_id` para SELECT/INSERT/UPDATE/DELETE. Admin via `has_role`.

**Backfill:** inserir um registro `NOVO` para cada `purchase` PAID existente do usuário ao abrir a página (upsert idempotente client-side, simples e barato dado o volume baixo).

### UI (`src/pages/MyLeads.tsx` reescrita)

```text
┌─ NOVO ──┬─ EM CONVERSA ─┬─ AGENDADO ─┬─ VENDIDO ─┬─ PERDIDO ─┐
│ [card]  │ [card]        │ [card]     │ [card]    │ [card]    │
│ [card]  │ [card]        │            │           │           │
└─────────┴───────────────┴────────────┴───────────┴───────────┘
```

**Card** (compacto):
- Nome do lead
- Telefone + ícone WhatsApp clicável (abre `https://wa.me/55XXXXXXXXXXX` direto)
- Badge da etapa atual
- Indicador 📝 se tiver anotação
- Click no card → abre Dialog de detalhes/anotações

**Dialog de detalhes** (substitui ou estende o `PurchasedLeadModal` atual):
- Mostra todos os dados do lead (igual hoje)
- Campo `Textarea` de anotações (autosave com debounce 800ms ou botão Salvar)
- Select para mover de etapa (alternativa ao drag)
- Botão WhatsApp grande
- Mantém o "Não consegui contato" existente

**Drag & drop:** usar `@dnd-kit/core` + `@dnd-kit/sortable` (já é o padrão do ecossistema React e leve). Em mobile, o Select dentro do card serve como fallback acessível.

### Fluxo de dados
1. Carrega `purchases` PAID do usuário (já existe).
2. Carrega `lead_crm_status` do usuário.
3. Para purchases sem status → upsert NOVO em batch.
4. Merge client-side: agrupa por `stage`.
5. Drag/move → `update lead_crm_status set stage=... where id=...`, otimista (UI atualiza antes da resposta).
6. Anotação → update `notes`.

### Botão WhatsApp
Helper que normaliza o telefone (já há padrão 12 dígitos no projeto):
```ts
const wa = `https://wa.me/${normalizePhoneToWa(lead.phone)}`;
```
Click: `window.open(wa, '_blank')` + `e.stopPropagation()` pra não abrir o modal.

### Mobile (viewport 925px e abaixo)
- Em telas <768px, kanban vira **abas horizontais** (`Tabs` shadcn) com uma coluna por aba — drag & drop funciona mal em mobile mesmo. O Select no card permite mover.
- Em telas ≥768px, grid de 5 colunas com scroll horizontal se necessário.

### Arquivos
- **Migration nova:** criar tabela `lead_crm_status` + RLS + index `(user_id, stage)`
- **Editar:** `src/pages/MyLeads.tsx` (reescrita completa pra kanban)
- **Novo:** `src/components/myleads/LeadKanbanCard.tsx`
- **Novo:** `src/components/myleads/LeadKanbanColumn.tsx`
- **Novo:** `src/components/myleads/LeadCrmDialog.tsx` (detalhes + anotações + mover)
- **Novo:** `src/lib/whatsapp.ts` (helper `normalizePhoneToWa` se ainda não existir centralizado)
- **Dependência:** adicionar `@dnd-kit/core` e `@dnd-kit/sortable`

### Observações
- Sem realtime (overhead desnecessário pra uso pessoal); poll de 10s mantido pra pegar novas compras.
- Anotações privadas — só o dono vê (RLS garante).
- Etapa `VENDIDO` e `PERDIDO` ficam com visual diferenciado (verde/cinza) pra dar fechamento visual.
