
## Plano: Integração com Resend para Validação de Email e Recuperação de Senha

### Visão Geral

Implementar duas funcionalidades de email usando o Resend:
1. **Validação de Email no Cadastro** - Enviar código de verificação antes de completar o registro
2. **Recuperação de Senha** - Opção "Esqueci minha senha" na tela de login

---

## Parte 1: Validação de Email no Cadastro

### Fluxo do Usuário

```text
1. Usuário preenche dados gerais (incluindo email) - Step 2
2. Ao clicar "Avançar", um código de 6 dígitos é enviado ao email
3. Modal abre pedindo o código de verificação
4. Usuário digita o código recebido
5. Se correto, avança para o próximo step
6. Se incorreto, pode reenviar ou corrigir o email
```

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/send-email-code/index.ts` | Edge Function para enviar código via Resend |
| `supabase/functions/verify-email-code/index.ts` | Edge Function para verificar código |
| `src/components/auth/EmailVerificationModal.tsx` | Modal para digitar código de verificação |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/config.toml` | Adicionar configuração das novas Edge Functions |
| `src/components/auth/MultiStepSignup.tsx` | Integrar validação de email antes de avançar do Step 2 |
| `src/components/auth/steps/PFGeneralDataStep.tsx` | Adicionar estado de email verificado |
| `src/components/auth/steps/PJGeneralDataStep.tsx` | Adicionar estado de email verificado |

### Tabela do Banco de Dados

Nova tabela `email_verification_codes`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| email | text | Email do usuário |
| code | text | Código de 6 dígitos |
| expires_at | timestamp | Expiração (5 minutos) |
| verified | boolean | Se foi verificado |
| created_at | timestamp | Data de criação |

### Edge Function: send-email-code

```typescript
// Pseudocódigo da lógica principal
1. Recebe email do request
2. Valida formato do email
3. Gera código aleatório de 6 dígitos
4. Salva no banco com expiração de 5 minutos
5. Envia email via Resend com template em português
6. Retorna sucesso
```

Template do email:
- Assunto: "LeadBay - Código de Verificação"
- Corpo: Código em destaque + instruções
- Remetente: noreply@leadbay.com.br

---

## Parte 2: Recuperação de Senha

### Fluxo do Usuário

```text
1. Na tela de login, usuário clica em "Esqueci minha senha"
2. Modal abre pedindo o email
3. Email de recuperação é enviado com link
4. Usuário clica no link e vai para página de nova senha
5. Define nova senha e confirma
6. Senha atualizada, redireciona para login
```

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/send-password-reset/index.ts` | Edge Function para enviar email de reset |
| `src/components/auth/ForgotPasswordModal.tsx` | Modal para solicitar recuperação |
| `src/pages/ResetPassword.tsx` | Página para definir nova senha |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/config.toml` | Adicionar configuração da Edge Function |
| `src/pages/Auth.tsx` | Adicionar link "Esqueci minha senha" e modal |
| `src/App.tsx` | Adicionar rota /reset-password |

### Edge Function: send-password-reset

```typescript
// Pseudocódigo da lógica principal
1. Recebe email do request
2. Gera token de recuperação via Supabase Auth
3. Cria URL de reset: https://leadbay.com.br/reset-password?token=...
4. Envia email via Resend com link
5. Retorna sucesso (mesmo se email não existir, por segurança)
```

Template do email:
- Assunto: "LeadBay - Recuperação de Senha"
- Corpo: Link de reset + validade de 1 hora
- Remetente: noreply@leadbay.com.br

---

## Configuração Necessária

### Secret do Resend

Será necessário adicionar a API Key do Resend:

| Nome do Secret | Valor |
|----------------|-------|
| `RESEND_API_KEY` | Sua chave de API do Resend |

### Configuração do supabase/config.toml

```toml
[functions.send-email-code]
verify_jwt = false

[functions.verify-email-code]
verify_jwt = false

[functions.send-password-reset]
verify_jwt = false
```

---

## Detalhes Técnicos

### Componente: EmailVerificationModal

```text
Estrutura:
- Título: "Verificar seu E-mail"
- Descrição: "Enviamos um código para {email}"
- Input: 6 dígitos (usando input-otp existente)
- Botão: "Verificar Código"
- Link: "Reenviar código" (com cooldown de 60s)
- Link: "Alterar email"
```

### Componente: ForgotPasswordModal

```text
Estrutura:
- Título: "Esqueci minha senha"
- Descrição: "Digite seu email para receber instruções"
- Input: Email
- Botão: "Enviar link de recuperação"
- Mensagem de sucesso após envio
```

### Página: ResetPassword

```text
Estrutura:
- Título: "Definir Nova Senha"
- Input: Nova senha (com toggle mostrar/ocultar)
- Input: Confirmar senha
- Botão: "Salvar Nova Senha"
- Validação: mínimo 6 caracteres, senhas iguais
```

---

## Alterações na UI de Cadastro

### Step 2 (Dados Gerais)

Após preencher o email e clicar "Avançar":

1. Validar formato do email
2. Chamar Edge Function `send-email-code`
3. Abrir `EmailVerificationModal`
4. Só avançar para Step 3 após verificação bem-sucedida

### Visual

```text
Campo de email após verificação:
[seu@email.com] ✓ Verificado
```

---

## Alterações na UI de Login

### Tela de Login

Adicionar link abaixo do botão "Entrar":

```text
[Entrar]

Não tem conta? Cadastre-se
Esqueci minha senha  ← NOVO
```

---

## Resumo das Alterações

### Novas Edge Functions (3)
1. `send-email-code` - Enviar código de verificação
2. `verify-email-code` - Verificar código digitado
3. `send-password-reset` - Enviar email de recuperação

### Novos Componentes (2)
1. `EmailVerificationModal` - Modal de verificação no cadastro
2. `ForgotPasswordModal` - Modal de recuperação de senha

### Nova Página (1)
1. `ResetPassword` - Página para definir nova senha

### Nova Tabela (1)
1. `email_verification_codes` - Armazenar códigos de verificação

### Arquivos Modificados (5)
1. `supabase/config.toml` - Configurar novas functions
2. `src/App.tsx` - Adicionar rota /reset-password
3. `src/pages/Auth.tsx` - Adicionar link e modal de recuperação
4. `src/components/auth/MultiStepSignup.tsx` - Integrar verificação de email
5. Steps de dados gerais - Mostrar status de verificação

---

## Ordem de Implementação

1. Solicitar RESEND_API_KEY do usuário
2. Criar tabela `email_verification_codes`
3. Criar Edge Functions de email
4. Criar componentes de UI
5. Integrar no fluxo de cadastro
6. Integrar recuperação de senha no login
7. Testar fluxos completos
