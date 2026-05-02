## Objetivo

Trocar o wizard atual de 6 etapas por um **cadastro mínimo de 1 página** (Nome, Telefone, Estado/Cidade, Email, CRECI+UF, Senha), adicionar **Sign in with Google** (cadastro e login), e mostrar um **lembrete recorrente a cada 3 dias** dentro do sistema para o usuário completar o perfil (dados profissionais completos + termos legais).

---

## 1. Cadastro simplificado (`/cadastro`)

Novo componente `SimpleSignup.tsx` que substitui o `MultiStepSignup` na página `/cadastro`. Tudo numa tela só, sem steps:

- Nome completo
- Telefone (com máscara, validação 12 dígitos via regra atual)
- Estado + Cidade (reutiliza o `LocationSelector` que já existe)
- Email
- CRECI (número + UF) — opcional? **Pergunta para o usuário abaixo**
- Senha + Confirmar senha
- Botão **"Criar conta"**
- Separador `— ou —`
- Botão **"Continuar com Google"**
- Link para login

Ao submeter:
- `supabase.auth.signUp()` com `person_type=PF`, `profession=CORRETOR` (assumido), `name`, `phone`, `email`, `address_uf`, `address_city`, `creci`, `creci_uf` no metadata.
- Redireciona para `/cadastro-realizado` → `/primeiros-passos` (fluxo já existente).

**Importante:** A função `validate_signup_metadata` no banco hoje exige `address`, `address_neighborhood`, `cpf`, `accepted_contract`, `accepted_dpa`, `accepted_terms_of_use`. Vamos **relaxar essa validação** para tornar esses campos opcionais no cadastro inicial — eles passam a ser exigidos só na hora de completar o perfil.

## 2. Login com Google

- Usar a integração nativa **Lovable Cloud Auth** (`lovable.auth.signInWithOAuth("google", ...)`) — vou rodar a ferramenta `Configure Social Login` para gerar o módulo `src/integrations/lovable/`.
- Botão "Continuar com Google" tanto em `/auth` (login) quanto em `/cadastro`.
- Quando o usuário entra pela primeira vez via Google, o trigger `handle_new_user` cria o profile com os dados que vierem do Google (`name`, `email`) — sem CRECI, sem endereço, sem termos. Marcado como **perfil incompleto**.

## 3. Flag de "perfil completo" no banco

Migration:
- Coluna `profiles.profile_completed boolean default false`
- Coluna `profiles.last_completion_reminder_at timestamptz`
- Função SQL `mark_profile_complete(p_user_id)` que valida se todos os campos obrigatórios estão preenchidos (CPF/CNPJ, endereço completo, registro profissional, 3 termos aceitos) e marca `profile_completed = true`.
- Ajustar `validate_signup_metadata` para **só validar campos básicos** (nome ou company_name, email, telefone, person_type) no signup inicial.

## 4. Modal "Complete seu cadastro"

Novo componente `CompleteProfileReminder.tsx`, montado dentro do `Layout.tsx` (só quando `user` logado).

Lógica:
- Ao logar, busca `profiles.profile_completed` e `profiles.last_completion_reminder_at`.
- Se `profile_completed = false` **e** (nunca mostrou OU passou >= 3 dias desde último), abre modal:
  - Título: "Complete seu cadastro"
  - Texto: "Complete seu cadastro para poder acompanhar leads, imóveis e parcerias da sua região."
  - Botões: **"Completar agora"** (vai para `/profile?complete=1`) e **"Mais tarde"** (fecha).
- Ao fechar (qualquer botão), atualiza `last_completion_reminder_at = now()`.

## 5. Wizard de "Completar perfil" (em `/profile`)

Reaproveita as etapas do `MultiStepSignup` atual (PF/PJ, profissão, registro profissional, dados pessoais/empresa, contratos), mas:
- Vira um **modal/wizard dentro de `/profile`**, ativado por `?complete=1` ou por botão "Completar cadastro".
- Pré-preenche o que já existe.
- No final, chama `mark_profile_complete()` no banco.
- Se completar com sucesso, modal de lembrete não aparece mais.

---

## Detalhes técnicos

**Arquivos novos:**
- `src/components/auth/SimpleSignup.tsx` — formulário de 1 página
- `src/components/auth/GoogleAuthButton.tsx` — botão reutilizável
- `src/components/profile/CompleteProfileReminder.tsx` — modal de lembrete
- `src/components/profile/CompleteProfileWizard.tsx` — wizard reaproveitando os steps atuais

**Arquivos editados:**
- `src/pages/Cadastro.tsx` — usa `SimpleSignup` em vez de `MultiStepSignup`
- `src/pages/Auth.tsx` — adiciona botão Google
- `src/pages/Profile.tsx` — abre `CompleteProfileWizard` quando `?complete=1` ou via botão
- `src/components/Layout.tsx` — monta `<CompleteProfileReminder />` para usuários logados
- `src/hooks/useAuth.tsx` — expõe `profileCompleted`

**Migration:**
```sql
ALTER TABLE profiles 
  ADD COLUMN profile_completed boolean DEFAULT false,
  ADD COLUMN last_completion_reminder_at timestamptz;

-- Marca perfis antigos (com dados completos) como já completos
UPDATE profiles SET profile_completed = true 
WHERE cpf IS NOT NULL AND address IS NOT NULL AND accepted_terms = true;

-- Relaxa validate_signup_metadata para só exigir nome/email/phone/person_type
-- Cria função mark_profile_complete(uuid)
```

**Configure Social Login:** Vou rodar a ferramenta para Google. A credencial gerenciada do Lovable Cloud é usada por padrão (sem precisar criar OAuth client no Google Cloud).

---

## Ponto que preciso confirmar

O cadastro simples pede **CRECI** — isso assume que toda pessoa nova é corretora. O sistema atual suporta arquiteto, engenheiro, PJ (imobiliária/construtora). Como tratar isso no cadastro simplificado?
