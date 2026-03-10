

## Remover filtro de cidade no envio de email de novo lead

### O que muda

Hoje a edge function `notify-new-lead` filtra perfis pela cidade (`address_city`) do lead, enviando email apenas para corretores da mesma cidade. A mudança remove esse filtro — todos os corretores ativos com email receberão a notificação de novo lead.

### Alterações em `supabase/functions/notify-new-lead/index.ts`

1. **Remover filtro por cidade (linhas 816, 821, 833-835)**: Eliminar `normalizedCity` e o `.filter()` por `address_city`. Usar todos os perfis ativos com email diretamente.
2. **Remover `.not("address_city", "is", null)` da query (linha 821)**: Não precisa mais exigir cidade no perfil.
3. **Atualizar logs**: Ajustar mensagens de console que mencionam "in city".
4. **Atualizar texto do email (linhas 777-778)**: Trocar "cadastrado na mesma cidade deste lead" por "cadastrado no LeadBay".
5. **Manter `city` no parâmetro obrigatório e no email**: A cidade do lead ainda aparece no email informativo, apenas não é usada como filtro de destinatários.

### Sem mudanças no frontend
O caller (`merge-or-create-lead`) continua enviando `city` normalmente — só o filtro de quem recebe muda.

