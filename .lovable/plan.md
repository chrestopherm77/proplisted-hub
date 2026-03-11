

## Permitir uso de vouchers diferentes pelo mesmo usuário

### O que muda

Hoje a validação na edge function `redeem-voucher` (linha 86-98) bloqueia o usuário se ele já usou **qualquer** voucher. A mudança faz com que o bloqueio seja apenas para o **mesmo voucher** — se usou o Voucher A, pode usar o Voucher B normalmente.

### Alteração em `supabase/functions/redeem-voucher/index.ts`

**Linha 86-98**: Trocar a query que verifica se o usuário usou "ANY voucher" para verificar se usou **este voucher específico**:

```typescript
// ANTES: bloqueia se usou qualquer voucher
.eq("user_id", userId)

// DEPOIS: bloqueia apenas se usou este mesmo voucher
.eq("user_id", userId)
.eq("voucher_id", voucher.id)
```

Atualizar a mensagem de erro para: `"Você já utilizou este voucher"`

### Resultado
- Usuário usou Voucher A → não pode usar A de novo, mas pode usar B
- Cada voucher continua respeitando seu `max_uses` global

