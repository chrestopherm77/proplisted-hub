

## Corrigir rastreamento de Page Views

### Problema identificado

O tracking de page views nao funciona por dois motivos:

1. **Permissao de banco**: O `upsert` do Supabase exige permissoes de INSERT **e** UPDATE. A tabela `lp_page_views` so tem politica de INSERT para anonimos, sem UPDATE. O upsert falha silenciosamente.

2. **Design do session_id**: O visitor ID e salvo no localStorage e reutilizado para sempre. Combinado com a constraint UNIQUE em `session_id`, o mesmo visitante nunca teria mais de 1 page view registrado — mesmo que o upsert funcionasse.

### Solucao

| Alteracao | Detalhe |
|---|---|
| Remover constraint UNIQUE de `session_id` | Permite multiplas visitas do mesmo visitante |
| Trocar `.upsert()` por `.insert()` no codigo | Elimina necessidade de permissao UPDATE |

### Detalhes tecnicos

**1. Migracao SQL**

```sql
ALTER TABLE lp_page_views DROP CONSTRAINT lp_page_views_session_id_unique;
```

**2. Alteracao em `src/components/leadform/LeadFormWizard.tsx`**

Trocar o bloco de tracking (linha ~388):

De:
```typescript
supabase.from('lp_page_views').upsert([{...}], { onConflict: 'session_id' })
```

Para:
```typescript
supabase.from('lp_page_views').insert([{...}])
```

O `session_id` continua sendo enviado (para analytics), mas agora cada visita cria um novo registro.

### Resultado esperado

- Cada acesso a pagina `/lp` registra 1 page view, independente do dispositivo ou visitante
- O painel admin mostra o total real de visitas
- O tracking de leads parciais nao e afetado (usa o mesmo `session_id` do localStorage normalmente)

