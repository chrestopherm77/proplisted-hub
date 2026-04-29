
# Disparo em grupo do WhatsApp por cidade

## O que muda

Hoje os 3 grupos atuais recebem TODO disparo de novo lead, novo balcão de parceria e re-disparo manual — independente de onde o lead está. A partir desta mudança, cada grupo passa a estar associado a **cidades específicas** (cidade + UF), e o disparo só vai para o grupo cuja lista contém a cidade do lead/imóvel/lançamento/procura.

Adicionalmente, criaremos disparos em grupo (que hoje não existem) para **novo Lançamento** e **novo Imóvel no Portal**, também roteados por cidade.

Cidades sem mapeamento → **não recebem disparo em grupo** (continuam normalmente as notificações individuais por alerta de match).

## Configuração inicial dos grupos

```text
Grupo Ribeirão Preto (já existe — passa a ser exclusivo dessa cidade):
  - Ribeirão Preto / SP
  Grupo IDs:
    120363407964054463@g.us
    120363426047592689@g.us
    120363410244397205@g.us

Grupo MG Histórico (novo):
  - Tiradentes / MG
  - Barbacena / MG
  - São João del Rei / MG
  Grupo ID:
    120363409744685071@g.us
```

## Banco de dados

Nova tabela `whatsapp_city_groups` (admin-only via RLS):

```text
id            uuid PK
group_jid     text   ex. "120363407964054463@g.us"
group_label   text   ex. "Ribeirão Preto - SP"
city          text   ex. "Ribeirão Preto"  (case-insensitive na busca)
uf            text   ex. "SP"
is_active     bool   default true
created_at    timestamptz
unique (group_jid, city, uf)
```

Função `get_groups_for_city(p_city text, p_uf text) returns text[]` (SECURITY DEFINER) — retorna todos os `group_jid` ativos cuja `(city, uf)` (normalizados: trim + lower + sem acento) batem com a entrada. Usada pelas edge functions.

Seed: insere os 4 mapeamentos acima.

## Edge functions afetadas

Cada uma deixa de ter os JIDs hardcoded e passa a chamar `get_groups_for_city` com a cidade/UF do payload. Se o array vier vazio, faz `console.log` "Cidade X/UF sem grupo mapeado — disparo ignorado" e retorna `success:true, skipped:true` (não é erro).

1. **`mega-webhook`** (novo lead pelo formulário) — extrai `city`/`uf` do `flow` (sell/buy/build/rent), igual já faz para `notify-property-match`.
2. **`notify-lead-group`** (re-disparo manual pelo admin) — extrai `city`/`uf` de `lead.form_data[intention.toLowerCase()]`.
3. **`notify-group-new-search`** (Balcão de Parceria — nova procura) — `city` e `state` já vêm no body; passa a usar.
4. **`notify-launch-group`** (NOVA) — chamada por `NewLaunch.tsx` após insert; recebe `launchId`, busca `city`/`state` da tabela `launches`, monta mensagem com dados do lançamento + link `/lancamentos/<id>`, dispara nos grupos da cidade.
5. **`notify-property-group`** (NOVA) — chamada por `NewProperty.tsx` após insert; recebe `propertyId`, busca `city`/`state` da tabela `properties`, monta mensagem com tipo, operação, bairro, valor, área, foto principal + link `/imovel/<reference_code>`, dispara nos grupos da cidade.

Continuam **inalteradas** (não viram por cidade): `daily-news-broadcast` (broadcast geral diário), `notify-alert-match`, `notify-launch-alert-match`, `notify-property-match` (todas individuais via WhatsApp pessoal, não grupo).

## Frontend — disparo nas criações novas

- `src/pages/NewLaunch.tsx` — após insert do lançamento, fire-and-forget invoca `notify-launch-group` (paralelo ao `notify-launch-alert-match` que já existe).
- `src/pages/NewProperty.tsx` — após insert do imóvel, fire-and-forget invoca `notify-property-group`.

## Tela de Admin

Nova aba/seção em `src/pages/Admin.tsx` chamada **"Grupos de WhatsApp por Cidade"** (componente `src/components/admin/WhatsappCityGroupsManagement.tsx`):

- Lista paginada agrupada por `group_label`/`group_jid` mostrando cidades+UF associadas.
- Botão "Novo mapeamento": form com campos `Group JID`, `Rótulo do grupo`, `Cidade` (autocomplete IBGE via `useIBGELocation`), `UF`, `Ativo`.
- Editar/desativar/excluir linha.
- Validação: JID precisa terminar em `@g.us`; não permite duplicata `(group_jid, city, uf)`.

Acesso restrito por `has_role('MASTER_ADMIN')` no RLS e checagem no front.

## Resumo de arquivos

**Migração SQL**
- Tabela `whatsapp_city_groups` + RLS + função `get_groups_for_city` + seed dos 4 mapeamentos.

**Edge functions**
- Editar: `mega-webhook`, `notify-lead-group`, `notify-group-new-search`.
- Criar: `notify-launch-group`, `notify-property-group`.

**Frontend**
- Editar: `src/pages/NewLaunch.tsx`, `src/pages/NewProperty.tsx`, `src/pages/Admin.tsx`.
- Criar: `src/components/admin/WhatsappCityGroupsManagement.tsx`.

## Comportamento garantido
- Visualização no app continua **global** (corretor vê tudo de qualquer cidade).
- Apenas o **disparo no grupo** é roteado.
- Cidade sem mapeamento → silencioso (nenhum grupo recebe; sem erro).
- Notificações individuais por alerta de match continuam exatamente como hoje.
