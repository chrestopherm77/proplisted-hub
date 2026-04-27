## Diagnóstico do bug

No cadastro, o trigger `handle_new_user` (no banco) já cria automaticamente uma assinatura **ACTIVE do plano grátis "Conexão"** e credita os 10 créditos. Tudo certo até aqui.

Porém, no **login** (`src/pages/Auth.tsx`), se houver um `pendingPlan` em sessionStorage (por exemplo `conexao` salvo pela LP/CTA antes do cadastro), o usuário é mandado para `/planos?plan=conexao`. Lá, o auto-trigger em `Planos.tsx` chama `create-subscription` para o mesmo plano que já está ativo. A edge function bate na **Guarda 4** ("Você já está neste plano") e devolve 400 → toast vermelho **"Erro ao ativar plano"**, mesmo com os créditos já tendo sido creditados pelo trigger.

Ou seja: o erro é apenas um efeito colateral do redirect automático para `/planos` com um plano que já estava ativo desde o cadastro.

## O que mudar

### 1. Redirecionar novos cadastros sempre para Primeiros Passos
- Em `src/components/auth/MultiStepSignup.tsx` (`handleSubmit`), **remover** o redirect para `/planos?plan=...` quando há `pendingPlan`. Sempre mandar para `/primeiros-passos`.
- Limpar o `pendingPlan` do sessionStorage no fim do cadastro para não vazar para um login futuro.
- Motivo: o usuário recém-cadastrado **já tem** o plano grátis ativo via trigger. Não faz sentido reabrir checkout do mesmo plano. Se ele escolheu um plano pago na LP, esse fluxo precisa de tratamento separado (item 3).

### 2. Login não deve abrir Planos com erro
- Em `src/pages/Auth.tsx` (`handleLogin`), no bloco que olha `pendingPlan`:
  - Buscar o plano pelo slug e checar se o usuário **já tem assinatura ativa nesse plano**.
  - Se já tem → limpar o `pendingPlan` e ir direto para `/leads` (sem mostrar erro).
  - Se ainda não tem → comportamento atual (`/planos?plan=...`) continua valendo (caso real onde o usuário precisa contratar).
- Alternativa mais simples e segura: como o trigger sempre ativa "conexao" no signup, **ignorar** silenciosamente `pendingPlan === 'conexao'` no login e ir para `/leads`. Mantemos a lógica para os planos pagos (`performance`, etc.).

### 3. Planos pagos: pós-pagamento ir para Primeiros Passos
Hoje, ao confirmar o pagamento via Asaas:
- O usuário paga pelo invoice (no site do Asaas).
- O webhook `asaas-webhook` marca a assinatura como ACTIVE.
- O usuário volta à aba e o `Planos.tsx` recarrega os dados (via `visibilitychange`).

Mudança proposta:
- Em `src/pages/Planos.tsx`, dentro de `loadData` (ou em um efeito derivado), detectar a transição `PENDING → ACTIVE` de uma assinatura paga **recém-confirmada** (ex.: criada na sessão atual, ou ativada nos últimos N minutos). Quando detectada:
  - Mostrar toast de sucesso ("Pagamento confirmado!").
  - Redirecionar para `/primeiros-passos`.
- Para evitar loops, marcar em sessionStorage que esse redirect já aconteceu para essa assinatura.

Não é necessário mudar nada no webhook — a detecção é client-side, no momento em que o usuário volta para a aba.

## Arquivos afetados

- `src/components/auth/MultiStepSignup.tsx` — sempre ir para `/primeiros-passos` após cadastro; limpar `pendingPlan`.
- `src/pages/Auth.tsx` — não abrir `/planos` quando o `pendingPlan` é o plano grátis que já está ativo; ir para `/leads`.
- `src/pages/Planos.tsx` — após detectar ativação de plano pago vinda de PENDING, redirecionar para `/primeiros-passos`.

## Resultado esperado

- **Cadastro novo (qualquer plano grátis ou clique em CTA grátis):** vai direto para `/primeiros-passos`. Sem erro. Créditos do plano Conexão já estão na conta.
- **Login normal:** vai para `/leads` (comportamento atual). Se houver `pendingPlan` de um plano pago real, continua indo para `/planos?plan=...`.
- **Plano pago, após pagamento confirmado:** assim que o usuário volta à aba e a assinatura vira ACTIVE, é redirecionado automaticamente para `/primeiros-passos` com toast de sucesso.

## Fora do escopo

- Conteúdo da página Primeiros Passos (vídeo, textos, lista de passos) — já existe e segue como está. Você pode ir refinando depois pelo painel admin de "Onboarding Video".
