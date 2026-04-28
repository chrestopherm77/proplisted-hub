## Objetivo

Garantir que **todos os campos** do cadastro multi-step sejam obrigatórios, com ênfase em CRECI / CAU / CREA. Eliminar o "atalho" da opção **Outro / Sem registro** que hoje permite PF concluir o cadastro sem nenhum registro profissional.

## Diagnóstico do que já está obrigatório (e o que não está)

Hoje, em `src/components/auth/MultiStepSignup.tsx`:

- **Step 2 (Dados Gerais PF/PJ):** nome/razão social, CPF/CNPJ, UF, cidade, bairro, endereço, e-mail e telefone — **todos já obrigatórios e validados** (CPF, CNPJ, e-mail, telefone). OK.
- **Step 3 PF (Profissão):** existe a opção `Outro` (`profession = 'NONE'`) que **pula** o passo de registro profissional, indo direto pra credenciais com 4 etapas no total. Isto contradiz a regra do projeto (PF restrito a Corretor / Arquiteto / Engenheiro).
- **Step 4 PF Profissional:** CRECI/CAU/CREA + UF já são obrigatórios — **mas só são exigidos se o usuário não escolheu "Outro"**.
- **Step 4 PJ:** CRECI PJ / CREA PJ + UF, nome do RT, CPF do RT (e CREA do RT na Construtora) já obrigatórios. OK.
- **Step Credenciais:** senha, confirmação e os 3 contratos já obrigatórios. OK.
- **Indicação (`referralCode`):** opcional — manter assim (confirmado pelo usuário).

Portanto, o gap real é:

1. Remover a opção "Outro" do PF.
2. Eliminar todo código que tratava `profession === 'NONE'` (cálculo de steps, labels e validação).
3. Pequeno reforço opcional de UX para deixar visualmente claro que tudo é obrigatório.

## Mudanças

### 1. `src/components/auth/steps/PFProfessionStep.tsx`
- Remover o item `NONE` do array `professions` — ficam apenas Corretor, Arquiteto e Engenheiro.
- Ajustar o grid para 3 cards (`sm:grid-cols-3`) para layout limpo.

### 2. `src/types/signup.ts`
- Atualizar o type `Profession` para `'CORRETOR' | 'ARQUITETO' | 'ENGENHEIRO'` (remover `'NONE'`).
- Não mexer em `initialFormData` (já é `null`).

### 3. `src/components/auth/MultiStepSignup.tsx`
- `getTotalSteps()`: PF agora **sempre** tem 5 steps (remover o ramo `=== 'NONE' ? 4 : 5`).
- `getStepLabels()`: remover o caso `profession === 'NONE'` que retornava 4 labels.
- `isStepComplete()` no step 4: remover o ramo `personType === 'PF' && profession === 'NONE'` que pulava direto para credenciais.
- `validateStep()` no step 4 PF: o guard `formData.profession !== 'NONE'` deixa de existir — sempre valida CRECI/CAU/CREA conforme a profissão.
- `isCredentialsStep`: remover a condição `formData.profession === 'NONE' && currentStep === 4`. Credenciais será sempre o step 5 para PF.
- `handleSubmit()`: remover o `else` implícito do `'NONE'` no metadata (já não existe a opção).

### 4. Reforço de UX (pequeno)
- Em `PFProfessionStep` e `PJCompanyTypeStep`, adicionar abaixo do título uma linha discreta: "Selecione uma opção (obrigatório)".
- Nos inputs de CRECI/CAU/CREA dos steps profissionais (`PFProfessionalDataStep` e `PJProfessionalDataStep`), adicionar asterisco visual (`*`) nas labels de todos os campos para deixar explícito que são obrigatórios. (A validação já existe; é só clareza visual.)

## Detalhes técnicos

```text
Antes (PF):
  Outro (NONE)  -> pula registro -> 4 steps total

Depois (PF):
  Apenas Corretor / Arquiteto / Engenheiro -> sempre 5 steps
  CRECI/CAU/CREA + UF sempre obrigatórios
```

Sem mudanças no banco: o handle `handle_new_user` já lida com profissões PF (CORRETOR/ARQUITETO/ENGENHEIRO) e o trigger não depende de `'NONE'`. Usuários antigos com `profession = 'NONE'` no perfil continuam intactos — a mudança vale só para novos cadastros.

## Memória a atualizar

A memória `mem://rules/auth` já diz "PF restricted to Corretor (CRECI), Arquiteto (CAU), Engenheiro (CREA)". Vou adicionar uma linha explicitando que a opção "Outro / Sem registro" **não existe mais no formulário** e que todos os campos do cadastro são obrigatórios, para evitar reintrodução acidental.

## Fora de escopo

- Não tornar o `referralCode` obrigatório (confirmado).
- Não alterar fluxo de verificação de e-mail nem checagem de telefone (já robustos).
- Não mexer em `Profile.tsx` (edição posterior do perfil) — a obrigatoriedade pedida é do **cadastro**.
