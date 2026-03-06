

## Trocar validacao por codigo OTP para checagem de existencia no WhatsApp

### O que muda

Hoje o usuario clica "Validar WhatsApp", recebe um codigo de 6 digitos no WhatsApp, digita o codigo, e so entao o numero e validado. O novo fluxo sera muito mais simples:

1. Usuario preenche nome e telefone
2. Clica em "Validar WhatsApp"
3. O sistema faz uma chamada API para checar se o numero existe no WhatsApp (sem enviar mensagem)
4. Se existe: marca como verificado, mostra email + termos
5. Se nao existe: mostra erro

Sem OTP, sem digitar codigo, sem esperar mensagem.

### Alteracoes

**1. Criar edge function `check-whatsapp` (`supabase/functions/check-whatsapp/index.ts`)**

- Recebe `{ phone }` no body
- Formata o numero para o padrao brasileiro (55 + DDD + numero sem 9o digito)
- Faz GET para a Mega API: `https://apinocode01.megaapi.com.br/rest/instance/isOnWhatsApp/megacode-Mj46Nd4U5tP?jid=55DDXXXXXXXX`
- Header `Authorization: Bearer ${MEGA_API_TOKEN}`
- Retorna `{ exists: true/false }` baseado na resposta da API

**2. Simplificar `ContactStep.tsx`**

- Remover imports de `InputOTP`, `InputOTPGroup`, `InputOTPSlot`
- Remover estados `otpValue`, `isVerifying`
- Remover funcoes `handleVerifyCode`, `handleResendCode`
- Simplificar `VerificationStep` para apenas `'input' | 'verified'` (sem `'verify'`)
- O botao "Validar WhatsApp" agora chama a nova edge function `check-whatsapp`
- Se `exists: true`, marca `phoneVerified: true` e vai direto para `verified`
- Se `exists: false`, mostra erro "Este numero nao possui WhatsApp ativo"
- Remover todo o bloco de UI do OTP (step `verify`)

**3. Nenhuma mudanca no wizard ou rotas** - apenas o comportamento interno do ContactStep muda.

### Resultado

- Fluxo mais rapido: usuario clica um botao, espera ~2s, e ja esta validado
- Sem necessidade de abrir WhatsApp para copiar codigo
- Mesma seguranca: a checagem e feita no backend via edge function (token protegido)

