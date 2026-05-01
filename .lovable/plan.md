## Reordenar etapas do cadastro

Reorganizar o wizard `MultiStepSignup` para a nova ordem de 6 etapas, separando senha, registro profissional, dados pessoais/contato e contratos.

### Nova ordem dos passos

| # | Etapa | Conteúdo |
|---|-------|----------|
| 1 | Tipo | PF ou PJ |
| 2 | Profissão / Tipo Empresa | Corretor/Arquiteto/Engenheiro (PF) ou Imobiliária/Construtora (PJ) |
| 3 | Senha | Senha + confirmação |
| 4 | Registro Profissional | CRECI/CAU/CREA (PF) ou CRECI-PJ/CREA-PJ + RT (PJ) |
| 5 | Dados Pessoais e Contato | Nome+CPF (PF) ou Razão Social+CNPJ (PJ), endereço, e-mail (com verificação por código), telefone |
| 6 | Contratos | Contrato de Parceria + DPA + Termos de Uso + código de indicação + botão Finalizar |

A verificação de e-mail (envio do código + modal) continua no passo de Dados Pessoais (passo 5), exatamente como hoje — o usuário precisa verificar o e-mail antes de avançar para Contratos.

### Mudanças em código

**`src/components/auth/MultiStepSignup.tsx`** (arquivo central):
- `getTotalSteps()` passa a retornar **6** quando há `personType`.
- `getStepLabels()` retorna:
  - PF: `['Tipo', 'Profissão', 'Senha', 'Registro', 'Dados Pessoais', 'Contratos']`
  - PJ: `['Tipo', 'Tipo Empresa', 'Senha', 'Registros', 'Dados Empresa', 'Contratos']`
- `isStepComplete()` reescrito por novo índice:
  - 1 → `personType`
  - 2 → `profession` (PF) ou `companyType` (PJ)
  - 3 → `password` válido + `confirmPassword` igual
  - 4 → registros conforme profissão/tipo de empresa (mesma lógica do antigo step 4)
  - 5 → nome/CPF (ou razão/CNPJ) + endereço + e-mail + telefone + **emailVerified**
  - 6 → `acceptedContract` + `acceptedDPA` + `acceptedTermsOfUse`
- `validateStep()` reorganizado seguindo o mesmo mapeamento (validações de CPF/CNPJ/e-mail/telefone movidas para o passo 5; validação de senha movida para o passo 3; validação de contratos isolada no passo 6).
- `handleNext()`:
  - Verificação de telefone (`check_phone_availability`) e envio do código de e-mail passam a rodar no **passo 5** (não mais no passo 2).
  - `handleEmailVerified` continua avançando para o próximo passo (de 5 para 6).
- `renderCurrentStep()` reescrito com o novo mapeamento (renderiza `CredentialsStep` no passo 3 e os dados pessoais no passo 5; o modal de contratos vira um novo step 6).
- `useEffect` de tracking atualizado para usar os novos labels e total de passos (mantém `signupTracking` funcionando).

**`src/components/auth/steps/CredentialsStep.tsx`**:
- Hoje concentra senha + 3 contratos + código de indicação. Será dividido em dois passos visuais via uma prop `mode`:
  - `mode="password"` → mostra apenas Senha + Confirmar Senha (passo 3).
  - `mode="terms"` → mostra os 3 checkboxes de contratos + campo de código de indicação + textos legais (passo 6).
- Alternativa equivalente: criar um novo componente `TermsStep.tsx` separando as responsabilidades (preferida para manter cada step coeso). Faremos isso: extrair a parte de contratos+indicação para `src/components/auth/steps/TermsStep.tsx` e simplificar `CredentialsStep` para conter apenas a senha.

**`src/lib/signupTracking.ts`** (verificação rápida): garante que aceite `totalSteps: 6` sem quebra. Nenhuma alteração de schema necessária — o helper já é genérico em `currentStep`/`totalSteps`/`stepLabel`.

**`StepIndicator`**: já é dinâmico (`stepLabels.length`) — sem alterações.

### Comportamento preservado

- Verificação de e-mail por código (modal) e checagem de telefone duplicado continuam acontecendo antes de sair da etapa de Dados Pessoais.
- Submissão final (`handleSubmit`) e redirecionamento para `/cadastro-realizado` ficam idênticos.
- Rastreamento de progresso (`trackSignupProgress` / `markSignupCompleted`) continua chamado a cada mudança e na conclusão.
- Nenhuma mudança de banco de dados é necessária.