# Botão fixo de grupo do WhatsApp em /primeiros-passos por cidade

## O que muda

1. A tabela `whatsapp_city_groups` ganha uma nova coluna `invite_url` (link público do WhatsApp tipo `https://chat.whatsapp.com/...`). Hoje só tem `group_jid` (usado pelas edge functions de disparo). O `invite_url` é o link humano que o corretor abre para entrar no grupo.

2. Na tela `/primeiros-passos`, **entre o player principal e a playlist** (no mobile e desktop), aparece um card destacado com:
   - Texto: *"Entre no grupo para ficar por dentro das buscas de imóveis na sua região"*
   - Botão verde "Entrar no grupo do WhatsApp" → abre o `invite_url` do grupo da cidade do corretor (`profile.address_city` + `profile.address_uf`).
   - Se a cidade do corretor **não tem grupo mapeado** ou o `invite_url` está vazio → o card **não aparece** (silencioso).

3. A tela de admin `Grupos de WhatsApp por Cidade` ganha um campo **"Link de convite (invite_url)"** no formulário, exibido junto do JID e do rótulo. O agrupamento por grupo continua igual (várias cidades por grupo).

## Configuração inicial

- Grupo Ribeirão Preto (SP) → `invite_url = https://chat.whatsapp.com/DpzEZJcOHidL2cspXByufQ?mode=hqctcla`
- Grupo MG Histórico (Tiradentes/Barbacena/São João del Rei) → `invite_url = https://chat.whatsapp.com/IMJu3N0WHl67rdy9jhRscn?mode=gi_t`

Aplicado em todas as linhas existentes desses dois grupos via `UPDATE` baseado no `group_jid`.

## Banco de dados

**Migração SQL**:
```sql
ALTER TABLE public.whatsapp_city_groups
  ADD COLUMN invite_url text;
```

**Update de dados** (via insert tool):
- `UPDATE whatsapp_city_groups SET invite_url='https://chat.whatsapp.com/DpzEZJcOHidL2cspXByufQ?mode=hqctcla' WHERE group_jid IN (3 JIDs de Ribeirão);`
- `UPDATE whatsapp_city_groups SET invite_url='https://chat.whatsapp.com/IMJu3N0WHl67rdy9jhRscn?mode=gi_t' WHERE group_jid='120363409744685071@g.us';`

**Nova função RPC** `get_invite_url_for_city(p_city text, p_uf text) returns text` (SECURITY DEFINER, STABLE) — retorna o primeiro `invite_url` ativo (não-nulo) que bate com a cidade/UF normalizadas (mesma lógica `immutable_unaccent_lower` já usada em `get_groups_for_city`). Retorna `NULL` se não houver.

## Frontend

**`src/pages/PrimeirosPassos.tsx`**
- Buscar `profile.address_city` / `profile.address_uf` do usuário logado (via `supabase.from('profiles').select(...).eq('id', user.id)`).
- Chamar a RPC `get_invite_url_for_city` com esses valores.
- Renderizar um novo componente `WhatsappGroupCTA` **entre o `<Card>` do player (lg:col-span-2) e a coluna da playlist no mobile**, e **no desktop** acima da playlist (ou ocupando a largura do player abaixo dele). Solução simples: renderizar logo após o bloco do player, antes do bloco da playlist no DOM — no desktop fica embaixo do player na coluna esquerda; no mobile fica naturalmente entre o player e a playlist (ordem do DOM).
- Card visualmente: fundo verde claro / borda verde, ícone do WhatsApp (lucide `MessageCircle`), texto + botão `<Button asChild><a href={invite_url} target="_blank" rel="noopener noreferrer">`.
- Não renderiza se `invite_url` for null/vazio.

**`src/components/admin/WhatsappCityGroupsManagement.tsx`**
- Adicionar campo `invite_url` na interface `Row` e no `empty`.
- Novo `<Input>` no Dialog: "Link de convite do grupo (https://chat.whatsapp.com/...)". Validação: se preenchido, deve começar com `https://chat.whatsapp.com/`.
- Mostrar o invite_url ao lado do JID no header de cada grupo (com link clicável "Abrir convite").
- Salvar/atualizar `invite_url` no insert/update.

## Comportamento garantido

- Disparo automático em grupos pelas edge functions continua usando `group_jid` (inalterado).
- Card de convite só aparece se a cidade do corretor tem mapeamento ativo com `invite_url` preenchido.
- Admin pode atualizar o link a qualquer momento sem mudar código.
- Mesma cidade aparecendo em múltiplas linhas (ex.: Ribeirão tem 3 JIDs) → retorna apenas 1 invite_url (o primeiro encontrado), evitando mostrar 3 botões.

## Resumo de arquivos

**Migração SQL**: adicionar coluna + função RPC.
**Update de dados**: preencher invite_url dos 4 mapeamentos existentes.
**Editar**: `src/pages/PrimeirosPassos.tsx`, `src/components/admin/WhatsappCityGroupsManagement.tsx`, `src/integrations/supabase/types.ts` (regenerado automaticamente).
