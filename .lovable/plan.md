

# Alterar Grupo WhatsApp e Botão de Disparo Manual no Admin

## Resumo
1. Trocar o GROUP_ID de `120363425145687461@g.us` para `120363410244397205@g.us` em ambas as edge functions que disparam para grupo.
2. Adicionar botão "Disparar no Grupo" no card de cada lead no Admin (LeadsManagement), que chama a Mega API via edge function para enviar a notificação do lead no grupo.

## Alterações

### 1. Trocar GROUP_ID nas edge functions
- **`supabase/functions/notify-group-new-search/index.ts`** linha 92: trocar para `120363410244397205@g.us`
- **`supabase/functions/mega-webhook/index.ts`** linha 184: trocar para `120363410244397205@g.us`

### 2. Criar edge function `notify-lead-group`
Nova function simples que recebe `leadId`, busca os dados do lead no banco, monta a mensagem e envia para o grupo via Mega API. Reutiliza o mesmo formato de mensagem do mega-webhook. Valida JWT de admin.

### 3. Adicionar botão no Admin LeadsManagement
- No card de cada lead, adicionar um botão com ícone de "Send" (megafone ou similar) ao lado dos outros botões.
- Ao clicar, chama `supabase.functions.invoke('notify-lead-group', { body: { leadId } })`.
- Mostra toast de sucesso ou erro.
- Título do botão: "Disparar no grupo WhatsApp".

## Arquivos modificados
1. `supabase/functions/notify-group-new-search/index.ts` — trocar GROUP_ID
2. `supabase/functions/mega-webhook/index.ts` — trocar GROUP_ID
3. `supabase/functions/notify-lead-group/index.ts` — nova edge function
4. `src/components/admin/LeadsManagement.tsx` — botão de disparo manual

