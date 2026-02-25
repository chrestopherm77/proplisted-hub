

## Rastreamento de Leads no Painel Admin

### Visao Geral

Criar um sistema de rastreamento completo para a pagina /lp com tres funcionalidades:

1. **Page Views** - contabiliza cada visita a /lp com dados do navegador
2. **Leads em Espera** - captura leads que preencheram nome/telefone mas nao finalizaram
3. **Rastreamento de Etapa** - atualiza em tempo real a ultima etapa que o visitante alcancou

### Banco de Dados

Duas novas tabelas:

**Tabela `lp_page_views`**
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | ID unico |
| session_id | text | ID da sessao do visitante (gerado no cliente) |
| user_agent | text | Navegador/dispositivo |
| referrer | text | De onde veio |
| screen_width | int | Largura da tela |
| screen_height | int | Altura da tela |
| language | text | Idioma do navegador |
| created_at | timestamptz | Data/hora da visita |

**Tabela `lp_partial_leads`**
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | ID unico |
| session_id | text | Vinculo com page_view |
| name | text | Nome preenchido |
| phone | text | Telefone preenchido |
| intention | text | Intencao (SELL/BUY/BUILD/RENT) |
| current_step | text | ID da etapa atual |
| step_index | int | Indice numerico da etapa |
| total_steps | int | Total de etapas visiveis |
| completed | boolean | Se finalizou o formulario |
| created_at | timestamptz | Inicio |
| updated_at | timestamptz | Ultima atualizacao |

RLS: ambas com INSERT publico (anonimo) e SELECT/UPDATE apenas para MASTER_ADMIN. A tabela `lp_partial_leads` tambem permite UPDATE publico filtrado por session_id.

### Frontend - Rastreamento (/lp)

**Arquivo: `src/components/leadform/LeadFormWizard.tsx`**

- Ao montar o componente, gerar um `sessionId` unico e inserir um registro em `lp_page_views` com dados do navegador (`navigator.userAgent`, `document.referrer`, `screen.width/height`, `navigator.language`)
- Ao avancar da etapa de contato (apos preencher nome/telefone), criar um registro em `lp_partial_leads` com nome, telefone, intencao e etapa atual
- A cada avanco de etapa, atualizar o registro em `lp_partial_leads` com a nova etapa (`current_step`, `step_index`)
- Ao submeter com sucesso (ultima etapa), marcar `completed = true`

### Frontend - Painel Admin

**Nova aba no Admin**: "Rastreamento" (5a aba nas tabs)

**Novo componente: `src/components/admin/LeadTracking.tsx`**

Dividido em duas secoes:

1. **Page Views** - Card com total de visualizacoes, grafico por dia (ultimos 30 dias), e tabela com detalhes recentes (navegador, data, referrer)

2. **Leads em Espera** - Tabela com leads parciais (nome, telefone, intencao, etapa onde parou, data). Exibe apenas os que tem `completed = false`. Badge colorido indicando a etapa. Botao para visualizar detalhes.

**Arquivo: `src/pages/Admin.tsx`**
- Adicionar nova tab "Rastreamento" com icone de atividade
- Importar e renderizar o componente `LeadTracking`

### Detalhes Tecnicos

**Migracao SQL:**
```text
-- Tabela de page views
CREATE TABLE lp_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_agent text,
  referrer text,
  screen_width int,
  screen_height int,
  language text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lp_page_views ENABLE ROW LEVEL SECURITY;

-- INSERT publico
CREATE POLICY "Allow anonymous insert" ON lp_page_views
  FOR INSERT WITH CHECK (true);

-- SELECT admin
CREATE POLICY "Admins can view" ON lp_page_views
  FOR SELECT USING (has_role(auth.uid(), 'MASTER_ADMIN'));

-- Tabela de leads parciais
CREATE TABLE lp_partial_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  name text,
  phone text,
  intention text,
  current_step text,
  step_index int DEFAULT 0,
  total_steps int DEFAULT 0,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lp_partial_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON lp_partial_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update by session" ON lp_partial_leads
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view" ON lp_partial_leads
  FOR SELECT USING (has_role(auth.uid(), 'MASTER_ADMIN'));
```

**Rastreamento no LeadFormWizard:**
- `useEffect` no mount: gera sessionId, insere page_view
- `useEffect` apos etapa de contato: cria partial_lead com upsert por session_id
- `handleNext`: apos avancar, atualiza partial_lead com step atual
- `handleSubmit` (sucesso): marca completed = true

**Componente LeadTracking:**
- Busca dados de `lp_page_views` (count total, agrupado por dia)
- Busca dados de `lp_partial_leads` onde `completed = false`
- Exibe cards com metricas e tabela detalhada
- Usa Recharts para grafico de page views por dia

### Arquivos Modificados/Criados

| Arquivo | Acao |
|---|---|
| Migracao SQL | Criar tabelas + RLS |
| `src/components/leadform/LeadFormWizard.tsx` | Adicionar logica de rastreamento |
| `src/components/admin/LeadTracking.tsx` | Novo componente |
| `src/pages/Admin.tsx` | Adicionar aba "Rastreamento" |

