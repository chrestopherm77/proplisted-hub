## Sistema de Chamados / Suporte (Chat)

Criar um sistema onde o usuário logado abre um **chamado** (reclamação, sugestão, dúvida) através de um chat flutuante. O admin vê todos os chamados num painel novo, abre cada um, conversa em tempo real e tem o WhatsApp/email do usuário num clique.

---

## 1. Banco de dados (migração)

### Tabela `support_tickets`
| coluna | tipo | descrição |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid (FK perfil) | autor |
| `subject` | text | assunto curto (auto-gerado da 1ª mensagem se vazio) |
| `category` | text | `RECLAMACAO` \| `SUGESTAO` \| `DUVIDA` \| `OUTRO` |
| `status` | text | `OPEN` \| `IN_PROGRESS` \| `RESOLVED` \| `CLOSED` (default `OPEN`) |
| `last_message_at` | timestamptz | para ordenação |
| `unread_by_admin` | boolean | badge no admin |
| `unread_by_user` | boolean | badge no chat do usuário |
| `created_at` / `updated_at` | timestamptz | |

### Tabela `support_messages`
| coluna | tipo | descrição |
|---|---|---|
| `id` | uuid PK | |
| `ticket_id` | uuid (FK tickets, ON DELETE CASCADE) | |
| `sender_id` | uuid | quem mandou |
| `sender_role` | text | `USER` ou `ADMIN` |
| `body` | text | conteúdo (pode ser vazio se só anexo) |
| `attachments` | jsonb | `[{ url, name, size, type }]` |
| `created_at` | timestamptz | |

### RLS
- `support_tickets`: usuário SELECT/INSERT/UPDATE só os seus próprios; admin (`MASTER_ADMIN`) tem ALL.
- `support_messages`: usuário SELECT/INSERT só onde `ticket.user_id = auth.uid()`; admin ALL.
- Trigger AFTER INSERT em `support_messages` que atualiza `last_message_at`, alterna `unread_by_admin`/`unread_by_user` conforme `sender_role`, e gera `subject` da 1ª mensagem se NULL.

### Realtime
- `ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets, support_messages;`

### Storage
- Novo bucket público `support-attachments` (imagens/prints até 5 MB). RLS: usuário autenticado pode UPLOAD em pasta `{user_id}/...`; SELECT público (link compartilhável no chat).

---

## 2. Chat flutuante para o usuário

Novo componente `src/components/support/SupportChatWidget.tsx`, renderizado dentro de `Layout.tsx` (apenas para usuários logados, escondido em rotas `/admin/*` e `/lp*`).

**UI:**
- Botão flutuante redondo no canto inferior direito (ícone `MessageCircle`, badge vermelho se houver `unread_by_user`).
- Ao clicar: drawer/popover com:
  - **Lista de chamados** do usuário (status + última mensagem) + botão "Novo chamado".
  - **Tela do chat:** select de categoria (Reclamação/Sugestão/Dúvida/Outro) ao abrir um novo, balões de mensagem (USER à direita, ADMIN à esquerda), input de texto + botão de anexo (clip).
  - Topo do chat exibe o e-mail e telefone do próprio usuário em texto pequeno ("Te respondemos por aqui ou no seu WhatsApp: …") — assim ele sabe que esses dados já estão visíveis para o admin sem digitar.
- Realtime: `subscribe` em `support_messages` filtrado por `ticket_id` para ver respostas do admin instantaneamente.
- Marca `unread_by_user = false` ao abrir o chat.
- Anexos: upload para `support-attachments/{user_id}/{ticket_id}/...`, valida tipo (imagem) e tamanho (≤5 MB), insere URL pública no campo `attachments`.

---

## 3. Painel admin — Chamados

### Sidebar
Adicionar item **"Chamados"** (`/admin/support`) no grupo **Pessoas** em `AdminLayout.tsx` (ícone `LifeBuoy` ou `MessageSquare`), com badge mostrando total de tickets com `unread_by_admin = true`.

### Rota e página
- `src/App.tsx`: nova rota `/admin/support` apontando para `<Admin section="support" />`.
- `src/pages/Admin.tsx`: registrar `support: SupportManagement`.
- `src/components/admin/SupportManagement.tsx`: layout em duas colunas:
  - **Esquerda:** lista de tickets ordenados por `last_message_at desc`, com filtros (status, categoria, busca por nome). Cada item mostra: nome do usuário, prévia, data, badge de não lidos.
  - **Direita:** thread do chat selecionado. Cabeçalho mostra:
    - Nome, e-mail, telefone do usuário.
    - Botão **"Abrir WhatsApp"** (`https://wa.me/{phone}` — usar normalização 12 dígitos já existente).
    - Botão **"Copiar e-mail"**.
    - Select de status (Aberto / Em andamento / Resolvido / Fechado).
  - Input para o admin responder + anexar imagem.
  - Realtime ligado: novas mensagens aparecem na hora; lista re-ordena.
  - Marca `unread_by_admin = false` ao selecionar o ticket.

---

## 4. Comunicação ao usuário e segurança

- Chat só funciona para **usuários autenticados** (não vou criar suporte anônimo nessa primeira versão).
- Tudo via SDK do Supabase (sem edge function nova): RLS protege os dados.
- Validação client-side com Zod: `body` máx 2000 chars; anexos só `image/*`, máx 5 MB, máx 5 por mensagem.
- Sem `dangerouslySetInnerHTML`. URLs renderizadas como `<a target="_blank" rel="noopener noreferrer">`.
- 100% PT-BR conforme padrão do projeto.

---

## Arquivos afetados

**Migração SQL** (tabelas + RLS + trigger + bucket).

**Novos arquivos:**
- `src/components/support/SupportChatWidget.tsx`
- `src/components/support/SupportTicketList.tsx`
- `src/components/support/SupportChatThread.tsx`
- `src/hooks/useSupportTickets.ts`
- `src/components/admin/SupportManagement.tsx`

**Editados:**
- `src/components/Layout.tsx` — montar `<SupportChatWidget />` para usuários logados (fora de rotas admin/LP).
- `src/components/admin/AdminLayout.tsx` — novo item "Chamados" + badge de não lidos.
- `src/pages/Admin.tsx` — registrar seção `support`.
- `src/App.tsx` — rota `/admin/support`.

---

## Fora de escopo (posso adicionar depois se quiser)

- Notificação por e-mail (Resend) ou WhatsApp ao admin quando chega mensagem nova.
- Atribuição de tickets a admins específicos.
- Suporte para usuários não autenticados (formulário público).
