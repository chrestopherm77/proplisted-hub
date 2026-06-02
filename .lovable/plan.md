## Objetivo
Criar rastreio de compras de leads com registro automático do primeiro contato via WhatsApp, e um novo painel admin para visualizar.

## 1. Banco de dados (migração)
Adicionar duas colunas na tabela `purchases`:
- `first_contact_at` (timestamptz, nullable) — quando o corretor clicou em WhatsApp pela primeira vez
- `contact_count` (integer, default 0) — quantas vezes clicou

Criar RPC `register_lead_contact(p_purchase_id uuid)`:
- valida que `auth.uid()` é o dono da `purchase`
- seta `first_contact_at = now()` apenas se for null (primeira vez)
- incrementa `contact_count`

## 2. CRM "Meus Leads" — ocultar telefone
Em `LeadKanbanCard.tsx` e `LeadCrmDialog.tsx`:
- Remover a exibição do número (`{lead.phone}`)
- Manter apenas o botão WhatsApp
- Ao clicar, chamar a RPC `register_lead_contact` antes de abrir `wa.me`
- Mostrar pequeno indicador "Contato em DD/MM HH:mm" quando `first_contact_at` existir (útil pro corretor saber)

O número continua sendo usado internamente para montar o link `wa.me`, só não é exibido em tela.

## 3. Novo painel admin "Rastreio de Compras"
- Nova seção em `src/pages/Admin.tsx`: chave `lead-purchase-tracking`
- Novo componente `src/components/admin/LeadPurchaseTracking.tsx`
- Adicionar item no sidebar admin
- Tabela com colunas:
  - Nome do corretor
  - Lead (nome)
  - Data de criação do lead (`leads.created_at`)
  - Data/hora da compra (`purchases.purchased_at`)
  - Data/hora do primeiro contato (`first_contact_at`) — ou badge "Sem contato"
  - Tempo entre compra e contato (calculado)
- Filtros: por corretor, por status de contato (contatou / não contatou), busca por nome
- Ordenação por data da compra (desc) por padrão

## Detalhes técnicos
- A RPC roda `SECURITY DEFINER` com checagem `auth.uid() = purchases.user_id`
- O painel admin lê via `supabase.from('purchases').select(...)` filtrando `status = 'PAID'`, com joins em `leads` e `profiles`
- Acesso ao painel restrito via `has_role(auth.uid(), 'MASTER_ADMIN')` no roteamento existente do AdminLayout
