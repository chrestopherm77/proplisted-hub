## Objetivo

Criar um formulário público (link compartilhável) que coleta os mesmos dados pedidos no "Novo portal" do admin, e mostrar as solicitações em uma nova aba dentro do admin. Sem integração automática — o admin recebe os dados e cria o portal manualmente depois.

## O que será criado

### 1. Página pública do formulário — `/solicitar-portal`
Formulário em etapas (ou seções) com TODOS os campos do modal do admin, em linguagem amigável para o corretor:

- **Dados do corretor**: Nome, e‑mail, telefone/WhatsApp
- **Marca**: Logo (upload), CNPJ, CRECI, cores (primária, destaque, fundo)
- **Hero (capa)**: Título, subtítulo, imagem de fundo
- **Sobre**: Texto sobre, imagem da seção sobre
- **Contato e endereço**: WhatsApp, telefone, e‑mail, endereço
- **Redes sociais**: Instagram, Facebook, TikTok, YouTube, LinkedIn
- **SEO**: Título do site, descrição, favicon
- **Fonte dos imóveis**: "Meus imóveis" ou "Todos da cidade X/UF"
- **Slug desejado** (ex: imoveis-joao) e domínio personalizado (opcional)
- **Rótulos do menu** (Início, Sobre, Contato, Financie, Negociar)
- **Texto do rodapé**

Sem login. Validação dos campos obrigatórios (nome, e‑mail, telefone, slug). Tela de sucesso ao final.

### 2. Tabela no banco — `broker_portal_requests`
Armazena cada solicitação enviada:
- nome, e‑mail, telefone do solicitante
- `branding` (jsonb), `seo` (jsonb), `slug`, `custom_domain`
- `properties_source`, `city`, `state`, `template_id`
- `status` ('NEW' | 'REVIEWED' | 'CREATED' | 'REJECTED')
- `notes` (admin)
- `created_at`

**RLS**:
- `INSERT` público (anon) com validação básica (nome/email/telefone preenchidos)
- `SELECT/UPDATE/DELETE` apenas para `MASTER_ADMIN`

### 3. Aba no admin — "Solicitações de Portal"
Dentro de `BrokerPortalsManagement` (ou nova seção do menu admin), uma lista das solicitações com:
- Resumo (nome, e‑mail, telefone, slug pedido, data, status)
- Botão "Ver detalhes" abre modal com TODOS os campos preenchidos
- Botão "Copiar dados" (JSON) e "Marcar como criado/rejeitado"
- Badge contador de solicitações novas

Sem criar o portal automaticamente — o admin lê e usa os dados manualmente no formulário existente "Novo portal".

### 4. Upload de imagens no formulário público
Para logo, hero e sobre, usar bucket público existente (ou criar `portal-requests` público). Usuário anônimo precisa poder fazer upload nesse bucket — política de storage permitindo INSERT anon.

## Detalhes técnicos

- Rota `/solicitar-portal` adicionada em `src/App.tsx`, página em `src/pages/SolicitarPortal.tsx`
- Componente do form reaproveita campos/labels do `BrokerPortalsManagement.tsx`
- Nova aba/sessão no admin: `src/components/admin/BrokerPortalRequests.tsx` listada em `Admin.tsx`
- Migração cria tabela + bucket de storage + políticas
- Link "Copiar link do formulário" no topo de "Portais de Imóveis" no admin para o admin enviar ao corretor

## Fora do escopo

- Criar o portal automaticamente a partir da solicitação
- Notificações por e‑mail/WhatsApp ao admin (pode ser adicionado depois)
- Edição da solicitação pelo corretor após envio
