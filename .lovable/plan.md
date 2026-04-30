## Página `/cadastro-realizado`

Criar uma página intersticial de sucesso após cadastro, com Meta Pixel dedicado e auto-redirecionamento.

### 1. Nova página `src/pages/CadastroRealizado.tsx`

- Layout no mesmo padrão do `ThankYou.tsx` (gradiente, `BrandLogo`, ícone `CheckCircle` verde).
- Conteúdo:
  - Título: "Cadastro realizado com sucesso!"
  - Subtítulo: "Bem-vindo(a) ao Conectae Imob. Você será redirecionado para o tour de Primeiros Passos."
  - Botão primário: **"Conhecer plataforma"** → navega para `/primeiros-passos`.
  - Texto auxiliar com contador regressivo: "Redirecionando em {n} segundos..." (5 → 0).
- Lógica:
  - `useEffect` com `setInterval` de 1s decrementando o contador.
  - Ao chegar em 0 (ou clicar no botão), `navigate('/primeiros-passos', { replace: true })`.
  - Limpar interval no unmount para evitar redirect duplicado.
- Meta Pixel `1603394050952329`:
  - Injetar script + `noscript` fallback no `useEffect` (mesmo padrão usado em `ThankYou.tsx`), disparando `PageView`.
  - Cleanup ao desmontar (remover scripts e limpar `window.fbq`/`_fbq`).

### 2. Registrar rota em `src/App.tsx`

- Adicionar `import CadastroRealizado from "./pages/CadastroRealizado"`.
- Adicionar `<Route path="/cadastro-realizado" element={<CadastroRealizado />} />` **acima** da rota catch-all `/:customSlug` (senão será capturada como landing page).

### 3. Ajustar redirecionamento pós-cadastro

Em `src/components/auth/MultiStepSignup.tsx` (linha 463):

```ts
setTimeout(() => { window.location.href = '/cadastro-realizado'; }, 800);
```

Mantém a limpeza do `pendingPlan` e o toast de sucesso já existentes. O fluxo de quem tem `pendingPlan` (vindo de uma LP de plano) não é afetado aqui porque essa lógica fica no login, não no cadastro — todo cadastro novo já cai sempre em primeiros passos hoje.

### Arquivos
- **Criar:** `src/pages/CadastroRealizado.tsx`
- **Editar:** `src/App.tsx`, `src/components/auth/MultiStepSignup.tsx`
