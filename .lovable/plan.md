

# Atualizar mensagem de confirmação WhatsApp do lead

## O que muda
Apenas o conteúdo da mensagem na edge function `send-lead-confirmation`. A estrutura (list message com botão) permanece igual.

## Arquivo modificado
**`supabase/functions/send-lead-confirmation/index.ts`** (linhas 62-82)

Trocar o `text`, `buttonText`, `description` e o conteúdo do `sections` para:

- **text**: `{firstName}, suas preferências foram recebidas.\n\nCentenas de profissionais em sua região serão notificados, e até 5 corretores que possuem as melhores opções para o seu perfil entrarão em contato.\n\nPrepare-se para o atendimento:\n\n1️⃣ Clique abaixo para liberar seu perfil e ativar a busca.\n\n2️⃣ Fique atento: nos próximos dias, esses especialistas falarão diretamente com você.`
- **buttonText**: `LIBERAR MEU ACESSO`
- **title do section row**: `Liberar meu acesso`
- **description do row**: `Libero meu perfil e ativo a busca por corretores`
- **rowId**: mantém `confirm_{leadId}`

Depois: deploy da function e teste via curl.

