## Objetivo

Ao concluir o cadastro inicial, o usuário é levado direto ao perfil e um modal guiado abre automaticamente. Ele preenche os dados que faltam em etapas, e na última etapa assina os 3 termos (Contrato de Parceria, DPA e Termo de Uso). Ao finalizar, o perfil é atualizado e marcado como completo.

## Fluxo

1. `SimpleSignup` (após `signUp` bem-sucedido) → mantém `/cadastro-realizado`.
2. Botão "Conhecer plataforma" em `/cadastro-realizado` → muda para "Completar meu cadastro" e navega para `/profile?complete=1` (já existe esse query param).
3. `Profile.tsx` detecta `?complete=1` e abre automaticamente o novo `<CompleteProfileModal />`.
4. Também adicionamos um botão "Completar agora" no `CompleteProfileBanner` que abre o mesmo modal (substitui o atual "Já preenchi tudo").

## Modal `CompleteProfileModal`

Componente novo em `src/components/profile/CompleteProfileModal.tsx`. Wizard com indicador de progresso.

Etapas (condicionais conforme PF/PJ já gravado em `profiles.person_type`):

```
Etapa 1 — Dados pessoais
  PF: CPF, profissão (se vazia)
  PJ: CNPJ, razão social, tipo de empresa, dados do RT
Etapa 2 — Endereço completo
  CEP/endereço, UF, cidade, bairro (UF/cidade já vêm do signup; pré-preenchidos)
Etapa 3 — Dados profissionais
  CRECI/CAU/CREA conforme profissão; CRECI já pode vir preenchido
Etapa 4 — Termos e assinatura
  3 checkboxes obrigatórios (Contrato, DPA, Termo de Uso)
  Cada um abre o modal de leitura existente (reaproveita CONTRACT_TERMS, DPA_TERMS, TERMS_OF_USE)
  Botão final: "Concluir cadastro"
```

Regras:
- Validação por etapa antes de avançar (zod).
- Campos já preenchidos vêm pré-populados (busca via `supabase.from('profiles').select('*')`).
- Não permite remover dado já preenchido (mesma regra do `Profile.tsx`).
- Não fecha por clique fora / ESC quando aberto via `?complete=1` (forçar conclusão), mas tem botão "Continuar depois" que fecha.

Ao clicar "Concluir cadastro":
1. `update` em `profiles` com todos os campos + `accepted_terms = true` + `accepted_contract = true` + `accepted_dpa = true` + `accepted_terms_of_use = true` + `terms_accepted_at = now()`.
2. Chama RPC `mark_profile_complete(p_user_id)` (já existe).
3. Toast de sucesso, fecha modal, remove `?complete=1` da URL, recarrega banner/perfil.

## Migração necessária

Adicionar colunas em `profiles` (se ainda não existirem) para registrar o aceite individual:
- `accepted_contract boolean default false`
- `accepted_dpa boolean default false`
- `accepted_terms_of_use boolean default false`
- `terms_accepted_at timestamptz`

(Já existe `accepted_terms` — manter por compatibilidade, mas marcar `true` junto.)

## Arquivos

- **novo** `src/components/profile/CompleteProfileModal.tsx` — wizard com 4 etapas + leitura/aceite dos termos (reaproveita `registrationTerms.ts`).
- **edit** `src/pages/Profile.tsx` — abre o modal automaticamente quando `?complete=1`.
- **edit** `src/components/profile/CompleteProfileBanner.tsx` — botão principal passa a abrir o modal (em vez de só marcar como completo).
- **edit** `src/pages/CadastroRealizado.tsx` — botão muda label e destino para `/profile?complete=1`.
- **migração** novas colunas em `profiles` para os 3 aceites + timestamp.

## Detalhes técnicos

- Reaproveita componentes existentes: `ProfilePersonalCard`, `ProfileLocationCard`, `ProfileProfessionalCard` dentro do wizard, ou cria sub-formulários enxutos com os mesmos campos. Recomendado: sub-formulários enxutos para caber bem no `Dialog`.
- `Dialog` com `max-w-2xl` e `ScrollArea` para conteúdo longo.
- Indicador de progresso: `<StepIndicator />` (já existe em `src/components/auth/StepIndicator.tsx`).
- Tipagem dos novos campos será refletida automaticamente em `src/integrations/supabase/types.ts` após a migração.
