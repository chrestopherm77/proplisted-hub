

## Correções: admin do usuário + UI mostrando plano não pago como ativo

Investiguei a conta `chresautomacao@gmail.com` (id `82390105-...`). Achei isto:

| Problema | Estado real |
|---|---|
| Role do usuário | Tem **MASTER_ADMIN** + USER (deveria ser só USER) |
| Assinatura ESSENCIAL | Status `PENDING` (sem pagamento confirmado) |
| Card "Minha Assinatura" | Mostra "ESSENCIAL · Aguardando pagamento" — passa a impressão de que o plano está liberado |
| `useSubscriptionLimits` | **Já está correto**: ignora PENDING, usa fallback Conexão. Limites estão sendo aplicados de fato (1 solicitação / 5 ofertas / 3 imóveis). |
| `NewPropertySearch.tsx` linha 103 | Bug: `if (isAdmin === false) navigate('/')` — **só admins conseguem entrar na página de criar parceria.** Quando removermos o admin desse usuário ele perderá o acesso. Hoje ele só estava entrando porque é admin. |

### Mudanças

**1. Remover MASTER_ADMIN do usuário** (operação de dados)
- `DELETE FROM user_roles WHERE user_id = '82390105-3c7a-4b7b-b52a-bb0395ba4224' AND role = 'MASTER_ADMIN'`
- Mantém o `USER`.

**2. Corrigir o gate invertido em `NewPropertySearch.tsx`**
- Linha 103: trocar `if (isAdmin === false) { navigate('/'); return; }` por simplesmente garantir que está logado. Criar parceria é função de qualquer usuário comum, não de admin.
- Verificar `NewProperty.tsx` e `NewLaunch.tsx` pelo mesmo padrão e corrigir se houver.

**3. Card "Minha Assinatura" — separar visualmente plano em uso vs. plano pendente**
- Quando a assinatura está `PENDING`, o card hoje exibe "ESSENCIAL · Aguardando pagamento" como se fosse o plano atual. Mudar para:
  - Bloco principal: **"Plano atual: CONEXÃO"** (o que está realmente liberado) com badge verde "Ativo".
  - Bloco secundário/alerta: "Você tem uma assinatura **ESSENCIAL** aguardando pagamento" + botão "Pagar fatura" (link Asaas) + "Cancelar tentativa".
  - Os indicadores de uso (`Imóveis no portal`, `Ofertas`, etc.) continuam refletindo o plano CONEXÃO até o pagamento confirmar.
- Isso elimina a confusão de "achei que já estava no Essencial".

**4. Página `/planos` — botão correto para plano com pagamento pendente**
- Hoje mostra "Plano atual" no card do plano cuja sub está PENDING. Mudar `Planos.tsx` para considerar só `ACTIVE` como plano atual. Para PENDING, o botão do card vira **"Concluir pagamento"** apontando pro `invoice_url`. Outros planos continuam clicáveis para troca.

**5. Polling pós-checkout (defesa em profundidade)**
- No `MySubscriptionCard` e `Planos`, após retorno do Asaas (foco da janela), refazer `load()` para pegar o webhook que confirmou. Já existe `refresh`, só falta disparar no evento `visibilitychange` quando o usuário volta da aba do Asaas.

### O que NÃO muda

- Lógica de `useSubscriptionLimits` (já correta — usa só ACTIVE).
- Webhook `asaas-webhook` (já credita certo quando paga).
- RLS, edge functions de criação/cancelamento.
- Plano CONEXÃO continua sendo o fallback automático.

### Arquivos afetados

- **Migration de dados**: `DELETE` do role MASTER_ADMIN do usuário citado.
- `src/pages/NewPropertySearch.tsx` — corrigir guard invertido.
- `src/pages/NewProperty.tsx` e `src/pages/NewLaunch.tsx` — verificar/corrigir guard se igual.
- `src/components/profile/MySubscriptionCard.tsx` — separar "plano em uso" de "tentativa pendente".
- `src/pages/Planos.tsx` — só considerar ACTIVE como plano atual + botão "Concluir pagamento" para PENDING.

