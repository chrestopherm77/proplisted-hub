

## Sistema de Indicação — 280 créditos por amigo

### 1. Banco de dados

Nova migração:

- Coluna `referral_code TEXT UNIQUE` em `profiles` (gerada automaticamente no signup, ex: `LB7K9X2A`).
- Coluna `referred_by UUID REFERENCES profiles(id)` em `profiles` para guardar quem indicou.
- Coluna `referral_credits_granted BOOLEAN DEFAULT false` em `profiles` para evitar premiar duas vezes.
- Atualizar `handle_new_user()` para gerar `referral_code` único e gravar `referred_by` quando vier `referral_code` no `raw_user_meta_data`.
- Função `redeem_referral(p_user_id, p_referral_code)` (SECURITY DEFINER):
  - Valida que o código existe e pertence a outro usuário.
  - Bloqueia se o usuário já usou (campo `referred_by` já preenchido) ou se já foi premiado.
  - Marca `referred_by` no novo usuário e dá +280 créditos pro indicador (`UPDATE profiles SET credit_balance = credit_balance + 280 ... ; INSERT credit_transactions type='REFERRAL_BONUS'`).
  - Retorna `jsonb` com sucesso/erro.

### 2. Pop-up pós-login

Componente novo `src/components/referral/ReferralPopup.tsx`:
- Aparece **uma vez por sessão** após login (controle via `sessionStorage` chave `referral_popup_shown`).
- Carregado via `Layout.tsx` quando `user` existe.
- Conteúdo:
  - Título: **"Indique um corretor e ganhe 280 créditos"**
  - Texto explicando: amigo se cadastra usando seu código → você ganha 280 créditos.
  - Caixa com **código de indicação do usuário** (lido de `profiles.referral_code`) + botão "Copiar código".
  - Mensagem pronta pré-formatada com botão "Copiar mensagem" e botão "Compartilhar no WhatsApp" (`https://wa.me/?text=...`):
    > Olá! 👋 Tô usando a LeadBay pra comprar leads de imóveis. Se você se cadastrar usando meu código de indicação **{CODE}**, eu ganho créditos e você entra numa plataforma top. Cadastra aqui: https://leadbay.com.br/auth
  - Botão **X** no canto e botão "Fechar" no rodapé.
- Dialog padrão (`@/components/ui/dialog`) — fácil fechar clicando fora ou no X.

### 3. Campo "Foi indicado?" no cadastro

`src/components/auth/steps/CredentialsStep.tsx`:
- Antes do bloco de termos, novo campo opcional: **"Foi indicado? Coloque o código aqui"** com `Input` em maiúsculas (auto-uppercase + trim).
- Adicionar `referralCode: string` em `SignupFormData` (`src/types/signup.ts`) e em `initialFormData`.
- `MultiStepSignup.handleSubmit`: incluir `referral_code: formData.referralCode` no `metadata` enviado ao `signUp`.
- Se preenchido, após `signUp` bem-sucedido chamar `supabase.rpc('redeem_referral', { p_user_id: <novoUserId>, p_referral_code: ... })`. Se a RPC der erro (código inválido), mostra toast mas **não bloqueia** o cadastro.
- Validação leve: 6-12 chars alfanuméricos. Sem código = ignora.

### 4. Detalhes técnicos

- Geração do `referral_code`: dentro do trigger `handle_new_user`, loop com `substring(md5(random()::text || NEW.id::text) for 8)` em uppercase, garantindo unicidade.
- Backfill: gerar códigos pra usuários já existentes na mesma migração.
- `credit_transactions.type` aceita string livre — usar `'REFERRAL_BONUS'` com `credits_used = 280` e `lead_id = NULL` (precisa permitir null; já é `Nullable: Yes`).
- O bônus é dado **uma única vez por novo usuário** (constraint via `referral_credits_granted` e checagem na RPC).
- Self-referral bloqueado (código próprio rejeitado).

### 5. O que NÃO muda

- Fluxo de signup, login, RLS atual.
- Tabelas `purchases`, `leads`, `properties`.
- Outros componentes do Layout/menu.

### Resultado

- Usuário loga → vê pop-up com seu código + mensagem pronta + botão WhatsApp/copiar/fechar.
- Compartilha o código com outro corretor.
- Outro corretor se cadastra preenchendo o campo "Foi indicado?" → indicador recebe 280 créditos automaticamente.
- Pop-up some pelo resto da sessão (volta a aparecer no próximo login).

