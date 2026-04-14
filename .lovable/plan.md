

# Correção: Payload da listMessage na send-lead-confirmation

## Problema

O payload atual envia os campos dentro de `messageData.listMessage`, mas a documentação da Mega API exige que todos os campos fiquem **diretamente** dentro de `messageData`. A API recebeu o `to` (enviou a mensagem), mas ignorou os campos da lista por estarem no nível errado.

**Formato atual (errado):**
```json
{
  "messageData": {
    "to": "...",
    "listMessage": {
      "title": "...",
      "text": "...",
      "buttonText": "...",
      "sections": [...]
    }
  }
}
```

**Formato correto (da documentação):**
```json
{
  "messageData": {
    "to": "...",
    "title": "...",
    "text": "...",
    "buttonText": "...",
    "description": "...",
    "sections": [...],
    "listType": 0
  }
}
```

## Mudança

Arquivo: `supabase/functions/send-lead-confirmation/index.ts`

Reestruturar o `megaBody` para:
```typescript
const megaBody = {
  messageData: {
    to: jid,
    title: "LeadBay",
    text: `Olá ${firstName}! 👋\n\nSomos da *LeadBay*...`,
    buttonText: "Confirmar interesse",
    description: "LeadBay - Conectando você ao corretor ideal",
    sections: [
      {
        title: "Confirmação",
        rows: [
          {
            title: "Sim, estou buscando!",
            description: "Confirmo que estou buscando um imóvel",
            rowId: `confirm_${leadId}`
          }
        ]
      }
    ],
    listType: 0
  }
};
```

Mudanças:
- Remover o wrapper `listMessage` — campos ficam direto em `messageData`
- Renomear `footerText` para `description` (campo correto da API)
- Adicionar `listType: 0`

Apenas 1 arquivo alterado, deploy e teste imediato.

