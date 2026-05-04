# Plano

## 1. Validação de WhatsApp no cadastro do sistema (`SimpleSignup.tsx`)

Replicar o fluxo do formulário público (`/lp` → `ContactStep.tsx`):

- Adicionar estado `phoneVerified` + `isCheckingWhatsApp`.
- Após o usuário digitar o telefone, exibir um botão **"Validar WhatsApp"** logo abaixo do campo.
- Ao clicar, chamar a edge function existente `check-whatsapp` com `{ phone }`.
  - Se `exists === true` → marcar como verificado, mostrar badge verde "WhatsApp verificado com sucesso!" e travar o campo telefone (disabled).
  - Se não → mostrar erro "Este número não possui WhatsApp ativo".
- Se o usuário editar o telefone depois, resetar `phoneVerified` para `false`.
- No `validate()` e no `handleSubmit`, **bloquear o envio** se `phoneVerified` for `false` (toast: "Valide seu WhatsApp antes de continuar").
- O botão "Criar conta" fica desabilitado enquanto o WhatsApp não estiver verificado.

## 2. Tornar TODOS os campos do cadastro obrigatórios

Hoje no `SimpleSignup` o **CRECI** e **UF do CRECI** são opcionais. Vamos tornar todos os campos visíveis obrigatórios:

- Remover o rótulo "(opcional)" do CRECI.
- Adicionar validação: `creci` obrigatório, `creciUf` obrigatório.
- Manter as validações já existentes de nome, telefone, UF, cidade, e-mail, senha e confirmação.
- Atualizar o metadata enviado ao Supabase para sempre incluir `creci`, `creci_uf` e `profession: "CORRETOR"`.

## 3. Bloquear remoção de dados pessoais já preenchidos no Perfil (`src/pages/Profile.tsx` + cards)

Regra: **se um campo já tem valor salvo no banco, o usuário pode editá-lo, mas não pode deixá-lo vazio**. Isso evita que pessoas "limpem" dados pessoais já fornecidos.

Implementação:

- Guardar um snapshot `initialProfile` logo após `fetchProfile()` (cópia do que veio do banco).
- Criar helper `isFieldLocked(field)` → retorna `true` se `initialProfile[field]` tinha conteúdo (não vazio/null).
- No `handleSave`:
  - Antes de chamar `update`, validar cada campo: se estava preenchido inicialmente e agora está vazio → bloquear o save com toast: "Não é possível remover [campo]. Você pode atualizar para um novo valor, mas não deixar em branco."
- Nos componentes filhos (`ProfilePersonalCard`, `ProfileLocationCard`, `ProfileProfessionalCard`, e o input de telefone direto em `Profile.tsx`):
  - Para `Input`: adicionar prop `required` quando o campo veio preenchido (visual) e onChange impede salvar vazio (validação acima cobre).
  - Para `Select`: não impedimos a UI de trocar valor, mas se o usuário tentar trocar para vazio, o save bloqueia.
  - Adicionar texto auxiliar discreto abaixo do campo bloqueado: *"Este dado não pode ser removido."*

Campos cobertos pelo bloqueio: todos os campos de `ProfileState` (nome, CPF, profissão, empresa, CNPJ, telefone, endereço, UF, cidade, bairro, CRECI/CAU/CREA PF e PJ, dados do RT). E-mail já é não editável.

## 4. Detalhes técnicos

- Reuso da edge function `check-whatsapp` (já existente, usada em `/lp`).
- `formatPhone` continua sendo usado no input.
- Não há mudanças de schema do banco.
- Não há nova RLS.

## Arquivos a editar

- `src/components/auth/SimpleSignup.tsx` — validação WhatsApp + tornar CRECI obrigatório.
- `src/pages/Profile.tsx` — snapshot + validação de "não pode esvaziar" no `handleSave`.
- `src/components/profile/ProfilePersonalCard.tsx` — texto auxiliar nos campos bloqueados.
- `src/components/profile/ProfileLocationCard.tsx` — idem.
- `src/components/profile/ProfileProfessionalCard.tsx` — idem.

Após sua aprovação, implemento as mudanças.
