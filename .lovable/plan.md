

## Plano: Badge "Promoção" com controle manual pelo admin + ordenação

### O que será feito

1. **Adicionar coluna `is_promotion` na tabela `leads`** (boolean, default false) via migration

2. **Ordenar leads no marketplace**: leads com `is_promotion = true` aparecem primeiro, depois os demais por data

3. **Badge visual "PROMOÇÃO"** nos cards do marketplace — badge piscando (animação pulse) em destaque

4. **Toggle no painel admin** (aba Leads) para marcar/desmarcar leads como promoção

### Detalhes técnicos

**Migration:**
```sql
ALTER TABLE public.leads ADD COLUMN is_promotion boolean DEFAULT false;
```

**Ordenação no marketplace (`src/pages/Leads.tsx`):**
- Após filtrar, ordenar: `is_promotion DESC, created_at ASC` (promoções primeiro, mais antigos antes)

**Badge piscante no card:**
- Badge amarelo/laranja com texto "🔥 PROMOÇÃO" e classe `animate-pulse` do Tailwind

**Admin (`src/components/admin/LeadsManagement.tsx`):**
- Adicionar botão/toggle de promoção em cada card de lead

### Arquivos modificados
- `src/pages/Leads.tsx` — ordenação + badge no card
- `src/components/admin/LeadsManagement.tsx` — toggle promoção
- `src/components/marketplace/LeadDetailsModal.tsx` — badge no modal

