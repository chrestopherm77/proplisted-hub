

# Plano: Confirmação de Lead via WhatsApp (Lista de Opções)

## Resumo

Quando um lead se cadastra na /lp, o sistema envia uma mensagem WhatsApp com lista de opções pedindo confirmação. Se confirmar, o lead fica visível em "Leads Disponíveis". Se não confirmar, fica em standby visível apenas para admins.

## Fluxo completo

```text
Lead preenche /lp
       │
       ▼
merge-or-create-lead (já existe)
  → cria lead com is_active = false (NOVO: começa inativo)
  → chama nova edge function "send-lead-confirmation"
       │
       ▼
send-lead-confirmation
  → envia listMessage via Mega API para o telefone do lead
  → mensagem: "Olá {nome}! Somos da LeadBay..."
  → botão: "Confirmar"
  → opção: "Sim, estou buscando" (rowId: "confirm")
       │
       ▼
Mega API webhook → nossa edge function "mega-webhook"
  → recebe messageType: "listResponseMessage"
  → verifica selectedRowId === "confirm"
  → atualiza lead: is_active = true, whatsapp_confirmed = true
       │
       ▼
Lead aparece em "Leads Disponíveis" para todos os corretores
```

## Mudanças necessárias

### 1. Migration: adicionar coluna `whatsapp_confirmed` na tabela `leads`

```sql
ALTER TABLE public.leads ADD COLUMN whatsapp_confirmed boolean DEFAULT false;
```

### 2. Alterar `merge-or-create-lead/index.ts`

- Novos leads criados com `is_active: false` (ao invés de `true`)
- Após criar o lead, chamar a edge function `send-lead-confirmation` passando nome, telefone e leadId

### 3. Nova edge function: `send-lead-confirmation`

- Recebe: `name`, `phone`, `leadId`
- Normaliza telefone (remove nono dígito, formato 12 dígitos)
- Envia `listMessage` via Mega API:
  - **to**: `{telefone}@s.whatsapp.net`
  - **title**: "LeadBay"
  - **text**: "Olá {nome}! Somos da LeadBay, uma plataforma que conecta você com corretores especializados na sua região. Confirme abaixo que está buscando um imóvel para que um corretor entre em contato."
  - **buttonText**: "Confirmar"
  - **sections**: 1 seção com 1 opção "Sim, estou buscando!" (rowId: `confirm_{leadId}`)

### 4. Nova edge function: `mega-webhook`

- Endpoint público que recebe webhooks da Mega API
- Filtra `messageType === "listResponseMessage"`
- Extrai `selectedRowId` do payload (`singleSelectReply.selectedRowId`)
- Se começa com `confirm_`, extrai o leadId
- Atualiza no banco: `leads.is_active = true, whatsapp_confirmed = true`
- Ignora outros tipos de mensagem

### 5. Ajustar `src/pages/Leads.tsx` (Leads Disponíveis)

- Filtrar apenas leads com `whatsapp_confirmed = true` (ou `is_active = true`, que já é o comportamento atual)

### 6. Ajustar painel Admin (LeadsManagement)

- Admins veem TODOS os leads, incluindo os não confirmados
- Badge visual "Aguardando confirmação" para leads com `whatsapp_confirmed = false`
- Botão para admin forçar ativação manual se necessário

### 7. Configurar webhook na Mega API

- Você precisará acessar o painel da Mega API e configurar a URL do webhook:
  `https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/mega-webhook`

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/merge-or-create-lead/index.ts` | Alterar `is_active: false`, chamar confirmação |
| `supabase/functions/send-lead-confirmation/index.ts` | **Novo** - envia listMessage |
| `supabase/functions/mega-webhook/index.ts` | **Novo** - recebe resposta do WhatsApp |
| `src/pages/Leads.tsx` | Sem mudança (já filtra `is_active`) |
| `src/components/admin/LeadsManagement.tsx` | Mostrar status de confirmação |
| Migration SQL | Adicionar coluna `whatsapp_confirmed` |

## Pré-requisito do usuário

Após a implementação, você precisará configurar o webhook no painel da Mega API apontando para a URL da edge function `mega-webhook`.

