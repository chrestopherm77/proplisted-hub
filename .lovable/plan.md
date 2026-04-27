## Problema

Na landing page pública (`/lp`), ao validar o WhatsApp do lead, o sistema retorna:
> Failed to send a request to the Edge Function

## Causa raiz

A função `check-whatsapp` é chamada da página pública `/lp` (usuário **não autenticado**), mas no arquivo `supabase/config.toml` ela **não tem** a linha `verify_jwt = false`. Por padrão, o gateway do Supabase exige JWT válido — e como o visitante anônimo não tem sessão, o POST é rejeitado **antes** de chegar à função.

Confirmado nos logs: só aparecem requisições `OPTIONS` (preflight CORS) com status 200, mas nenhum `POST` é registrado — ou seja, o request é barrado no gateway.

Outras funções públicas usadas na LP (ex: `send-whatsapp-code`, `verify-whatsapp-code`, `send-email-code`, `verify-email-code`, `merge-or-create-lead`, `send-lead-confirmation`) já estão corretamente configuradas com `verify_jwt = false`. A `check-whatsapp` ficou faltando.

## Correção

Adicionar o bloco no `supabase/config.toml`:

```toml
[functions.check-whatsapp]
verify_jwt = false
```

A função em si já está correta:
- CORS configurado com origens permitidas (incluindo `conectaeimob.com.br`)
- Validação de input (telefone obrigatório, max 20 chars)
- Normalização brasileira (12 dígitos, 55 + DDD + 8)
- Trata `MEGA_API_TOKEN` ausente com erro 500 amigável

Não é necessário mexer no código da função nem no `ContactStep.tsx`.

## Verificação pós-deploy

1. Acessar `/lp` em modo anônimo
2. Preencher nome + telefone com WhatsApp
3. Clicar em validar — deve receber confirmação ou erro real da Mega API (não mais "Failed to send a request")
4. Conferir nos logs da função `check-whatsapp` que agora aparecem requisições `POST 200`