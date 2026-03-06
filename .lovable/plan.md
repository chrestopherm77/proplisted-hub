

## Corrigir partial leads que já completaram o formulário

### Problema
Quando um lead finaliza o formulário, o sistema marca `completed: true` no `lp_partial_leads` usando o `session_id` do localStorage. Se o visitante completou em outra sessão/aba, o update não encontra o registro e o lead fica "em espera" mesmo já estando no marketplace.

Há 6 registros afetados atualmente (Miriam, Gustavo, Chrestopher).

### Correção em duas partes

**1. Limpeza dos dados existentes (SQL via insert tool)**

Marcar como `completed: true` todos os partial leads cujo telefone já existe em `lead_submissions`:

```sql
UPDATE lp_partial_leads SET completed = true 
WHERE completed = false 
AND phone IN (SELECT phone FROM lead_submissions);
```

**2. Correção no código — fallback por telefone**

No `LeadFormWizard.tsx`, após o submit bem-sucedido (linha ~698), além de marcar pelo `session_id`, adicionar um fallback que também marca pelo telefone:

```typescript
// Mark by session_id (existing)
supabase.from('lp_partial_leads')
  .update({ completed: true })
  .eq('session_id', sessionIdRef.current)
  .then(...)

// Fallback: mark by phone too
supabase.from('lp_partial_leads')
  .update({ completed: true })
  .eq('phone', formData.contact?.phone)
  .eq('completed', false)
  .then(...)
```

### Arquivos alterados
- `src/components/leadform/LeadFormWizard.tsx` — adicionar fallback de marcação por telefone

