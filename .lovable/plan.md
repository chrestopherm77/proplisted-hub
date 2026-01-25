

## Plano: Atualizar URL de Redirecionamento Pós-Pagamento

### Problema Identificado
Na Edge Function `create-payment`, a URL de redirecionamento após o pagamento está configurada com o domínio antigo:

```typescript
// Linha 110
const FRONTEND_URL = 'https://proplisted-hub.lovable.app';
```

Isso faz com que, após a confirmação do pagamento pelo Asaas, o usuário seja redirecionado para o domínio errado.

---

### Solução

**Arquivo a modificar:** `supabase/functions/create-payment/index.ts`

#### Alteração na linha 110

| Antes | Depois |
|-------|--------|
| `const FRONTEND_URL = 'https://proplisted-hub.lovable.app';` | `const FRONTEND_URL = 'https://leadbay.com.br';` |

---

### URLs de Callback Afetadas

Após a alteração, os redirecionamentos serão:

| Evento | URL Atual | URL Nova |
|--------|-----------|----------|
| Pagamento Confirmado | `https://proplisted-hub.lovable.app/checkout-success` | `https://leadbay.com.br/checkout-success` |
| Erro no Pagamento | `https://proplisted-hub.lovable.app/checkout-error` | `https://leadbay.com.br/checkout-error` |
| Checkout Expirado | `https://proplisted-hub.lovable.app/checkout-expired` | `https://leadbay.com.br/checkout-expired` |
| Cancelamento | `https://proplisted-hub.lovable.app/checkout-error` | `https://leadbay.com.br/checkout-error` |

---

### Sobre o Login do Usuário

O login permanecerá ativo após o redirecionamento desde que:
1. O domínio `leadbay.com.br` esteja configurado nas URLs permitidas do sistema de autenticação
2. O usuário tenha feito login pelo mesmo domínio (`leadbay.com.br`)

**Importante:** Se o usuário fizer login por `proplisted-hub.lovable.app` e for redirecionado para `leadbay.com.br`, a sessão não será mantida porque são domínios diferentes. O ideal é que o usuário sempre acesse o sistema pelo domínio `leadbay.com.br`.

---

### Fluxo Após a Correção

```text
1. Usuário acessa leadbay.com.br
2. Faz login e adiciona leads ao carrinho
3. Finaliza compra → Redirecionado para Asaas
4. Confirma pagamento no Asaas
5. Asaas redireciona para leadbay.com.br/checkout-success
6. Página mostra confirmação e redireciona para /my-leads
7. Usuário vê seus leads comprados (sessão mantida)
```

---

### Detalhes Técnicos

| Item | Valor |
|------|-------|
| Arquivo | `supabase/functions/create-payment/index.ts` |
| Linha | 110 |
| Alteração | Trocar domínio de `proplisted-hub.lovable.app` para `leadbay.com.br` |
| Deploy | Automático após edição |

