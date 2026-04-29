# Separar rotas de Login (/auth) e Cadastro (/cadastro)

## Objetivo
Hoje o arquivo `src/pages/Auth.tsx` serve **ambos** login e cadastro na rota `/auth`, alternando via state (`isLogin`) e via `?mode=login` / `?ref=` / `?plan=`. Você quer:

- `/auth` → **somente tela de Login**
- `/cadastro` → **somente tela de Cadastro multi-step** (a da foto)

## O que será feito

### 1. Criar nova página `src/pages/Cadastro.tsx`
Página dedicada ao signup. Renderiza o `MultiStepSignup` (mesmo componente já usado hoje), mantendo:
- Logo `BrandLogo` no topo
- Suporte a `?ref=CODIGO` para código de indicação
- Suporte a `?plan=slug` (persistência via `setPendingPlan`)
- Link "Já tenho conta" → navega para `/auth`

### 2. Simplificar `src/pages/Auth.tsx`
Remover toda a lógica de signup. A página passa a renderizar **apenas** o formulário de login (email + senha + "Esqueci minha senha"). O link "Não tem conta? Cadastre-se" passa a navegar para `/cadastro` (preservando query params `?ref=` e `?plan=` se existirem).

Se a URL chegar com `?ref=` ou `?plan=` em `/auth`, redireciona automaticamente para `/cadastro?ref=...&plan=...` (compatibilidade com links antigos).

### 3. Registrar rota em `src/App.tsx`
Adicionar:
```tsx
<Route path="/cadastro" element={<Cadastro />} />
```
Manter `/auth` apontando para `Auth` (agora só login).

### 4. Atualizar CTAs de cadastro para apontar a `/cadastro`
Trocar `navigate('/auth')` por `navigate('/cadastro')` **apenas onde a intenção é signup** (botão "Cadastre-se", CTAs da home):

- `src/pages/Index.tsx`:
  - `goAuth` (botão principal de cadastro do header) → `/cadastro`
  - Demais `navigate('/auth?mode=login')` (linha 78, 358, 382) permanecem em `/auth` (são botões "Entrar")
- `src/components/Layout.tsx` linha 41 (`<Link to="/auth">`) — verificar se é signup ou login; se for "Cadastre-se", trocar para `/cadastro`

Os demais `navigate('/auth')` (proteções de rota em Profile, Leads, BuyCredits, etc.) **permanecem inalterados** — são redirects de "usuário não logado", devem ir para a tela de login.

### 5. Atualizar `SupportChatWidget`
Adicionar `/cadastro` à lista `HIDDEN_PREFIXES` em `src/components/support/SupportChatWidget.tsx` para o widget de suporte não aparecer durante o cadastro (mesmo comportamento de `/auth`).

## Arquivos editados
- `src/pages/Cadastro.tsx` (novo)
- `src/pages/Auth.tsx` (remove signup, vira só login)
- `src/App.tsx` (adiciona rota `/cadastro`)
- `src/pages/Index.tsx` (CTA de signup → `/cadastro`)
- `src/components/Layout.tsx` (link de cadastro, se aplicável)
- `src/components/support/SupportChatWidget.tsx` (esconde widget em `/cadastro`)

## Compatibilidade
Links antigos como `/auth?ref=ABC123` ou `/auth?plan=conexao` continuam funcionando: o `Auth.tsx` detecta esses params e redireciona automaticamente para `/cadastro?ref=...&plan=...`.
