
## Trocar grupos de WhatsApp e corrigir disparos

### 1. Trocar IDs dos grupos
Hoje há um único grupo hardcoded em 3 edge functions: `120363410244397205@g.us`.

Vou substituir por **2 grupos**:
- `120363407964054463@g.us`
- `120363426047592689@g.us`

Cada notificação será enviada para os 2 grupos (loop), com retry independente. Se um falhar, o outro ainda recebe.

**Arquivos:**
- `supabase/functions/mega-webhook/index.ts` — disparo automático após confirmação WhatsApp do lead
- `supabase/functions/notify-lead-group/index.ts` — disparo manual via "megafone" no admin
- `supabase/functions/notify-group-new-search/index.ts` — disparo de nova procura no Balcão

### 2. Investigar por que o disparo não funciona

Pelos logs e código atual, vejo dois problemas prováveis:

**a) Retry insuficiente no `mega-webhook`** — quando o lead é ativado via WhatsApp, o disparo de grupo é "fire-and-forget" com 3 tentativas mas sem visibilidade no front. Se a Mega API retornar `{ error: true }` no body com HTTP 200, marcamos como falha e abandonamos sem alertar ninguém.

**b) Megafone (`notify-lead-group`)** — atualmente devolve 502 ao admin se as 3 tentativas falharem, mas pode estar falhando porque o ID do grupo antigo (`120363410244397205`) não existe mais ou o bot saiu dele. Trocar para os 2 novos IDs deve resolver.

**Plano de diagnóstico + correção:**
1. Deploy das 3 funções com os 2 novos IDs
2. Você dispara o megafone em 1 lead de teste
3. Eu leio os logs de `notify-lead-group` em tempo real (`edge_function_logs`) e confirmo se a Mega API aceitou para os 2 grupos
4. Se ainda falhar, o log da Mega vai mostrar o motivo exato (grupo inexistente, bot não é membro, token inválido, etc.) e ajustamos

### 3. Refatoração leve (centralizar IDs)
Para não ficar 3 lugares com IDs duplicados, vou criar uma constante no topo de cada função:
```ts
const WHATSAPP_GROUP_IDS = [
  "120363407964054463@g.us",
  "120363426047592689@g.us",
];
```
E loopar nessa lista ao enviar. Mantém local (sem secret novo) e fácil de editar depois.

### Arquivos editados
- `supabase/functions/mega-webhook/index.ts`
- `supabase/functions/notify-lead-group/index.ts`
- `supabase/functions/notify-group-new-search/index.ts`

### Próximo passo após implementação
Após deploy, peço que você dispare o megafone em 1 lead — eu leio os logs e confirmo se chegou nos 2 grupos. Se a Mega rejeitar, mostro o motivo exato.
