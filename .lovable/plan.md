## Painel de Feedback de Leads no Admin

Adicionar uma nova aba no painel Admin que mostra o status da automação de feedback por WhatsApp enviada para os leads (função `send-lead-feedback`).

### Onde aparece
- Nova aba **"Feedback de Leads"** dentro do `AdminLayout` (junto das outras abas de gestão).

### O que mostra (por lead)
Tabela com:
- Nome e telefone do lead
- Intenção (Comprar/Alugar/Vender/Construir) e cidade
- **Status do envio**: `Não enviado` / `Enviado` (com data) / `Reenviado` (tentativas > 1)
- **Tentativas** (0, 1 ou 2)
- **Resposta**:
  - `Pendente de resposta` (enviado e ainda sem reply)
  - `Ainda procurando` (PENDING — clicou no botão "Ainda estou procurando")
  - `Já não precisa` (DONE — clicou em "Já não estou procurando")
- Data da resposta
- Data de criação do lead

### Cards de resumo no topo
- Total de leads elegíveis
- Enviados
- Respondidos (DONE + PENDING)
- Sem resposta após 2 tentativas

### Filtros
- Status de resposta (Todos / Sem envio / Enviado sem resposta / Respondeu "Ainda procurando" / Respondeu "Já não precisa")
- Período de criação do lead
- Busca por nome ou telefone

### Detalhes técnicos
- **Novo componente**: `src/components/admin/LeadFeedbackTracking.tsx`
- **Registro no Admin**: adicionar a aba em `src/components/admin/AdminLayout.tsx` (e renderizar em `src/pages/Admin.tsx` se necessário, seguindo o padrão das outras abas)
- **Fonte de dados**: SELECT direto na tabela `leads` (colunas já existentes: `feedback_sent_at`, `feedback_attempts`, `feedback_response`, `feedback_responded_at`, mais `name`, `phone`, `form_data`, `is_active`, `is_exhausted`, `created_at`). Sem novas tabelas, sem migration, sem mudança em edge functions.
- Acesso restrito via `has_role('MASTER_ADMIN')` (padrão já usado nas outras abas Admin).
- 100% PT-BR.

### Fora do escopo (conforme sua resposta)
- Feedback do corretor — fica para depois.
- Botão de reenvio manual.
- Marcar "removido do sistema" como coluna dedicada (o status `is_active=false` continua sendo gerenciado pelo fluxo atual).