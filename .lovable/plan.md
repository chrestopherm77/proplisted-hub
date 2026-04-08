

# Plano: Seção "Lançamentos" — Cadastro e Vitrine de Empreendimentos

## Resumo
Nova seção para cadastrar e exibir lançamentos imobiliários com banner, informações gerais, valores, estrutura, arquivos PDF e contato do coordenador via WhatsApp.

---

## 1. Banco de Dados — Nova tabela `launches`

```sql
CREATE TABLE public.launches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  banner_url text,
  name text NOT NULL,
  state text,
  city text NOT NULL,
  neighborhood text,
  zone text,
  launch_date date,
  delivery_date date,
  price_from text,
  commission text,
  floors text,
  total_units text,
  associative text,
  book_url text,
  table_url text,
  drive_url text,
  coordinator_name text,
  coordinator_phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.launches ENABLE ROW LEVEL SECURITY;
```

**RLS**: Todos autenticados podem ver lançamentos ativos. Usuário insere/edita/deleta os próprios. Admins podem tudo.

**Storage**: Criar bucket `launches` para upload de banners e PDFs.

---

## 2. Novas Páginas

### `src/pages/Launches.tsx` — Listagem (Grid de Cards)
- Layout inspirado na imagem 2: grid de cards com banner, nome e valor "A partir de R$ X"
- Filtros: busca texto, cidade, tipo
- Botão "+ Novo Lançamento" no topo
- Ao clicar num card, navega para `/launches/:id`

### `src/pages/LaunchDetail.tsx` — Detalhe do Lançamento
- Layout inspirado na imagem 1:
  - Banner grande no topo
  - Nome do empreendimento como título
  - Card "Informações Gerais": Bairro, Zona, Data Lançamento, Data Entrega
  - Card "Valores e Bônus": A partir de, Comissão
  - Card "Estrutura": Andares, Total de Unidades, Associativo
  - Sidebar direita: Coordenador (nome + botão WhatsApp), Downloads (Book, Tabela, Drive — links para PDFs)

### `src/pages/NewLaunch.tsx` — Formulário de Cadastro
- Upload de imagem de banner (via Storage bucket `launches`)
- Nome do empreendimento
- Informações Gerais: Estado, Cidade, Bairro, Zona, Data Lançamento, Data Entrega
- Valores: A partir de (com máscara R$), Comissão
- Estrutura: Andares, Total de Unidades, Associativo
- Upload de PDFs: Book, Tabela, Drive (3 campos de upload de arquivo)
- Coordenador: Nome, Telefone (para link WhatsApp)
- Botão "Publicar"

---

## 3. Navegação

- Novo link "Lançamentos" no menu desktop (`Layout.tsx`) e mobile (`MobileMenu.tsx`)
- Rotas: `/launches`, `/launches/new`, `/launches/:id`
- Registrar em `App.tsx`

---

## 4. Storage

- Criar bucket `launches` via migration
- Policies: autenticados podem fazer upload; todos autenticados podem ler
- Banners salvos como `banners/{id}.{ext}`
- PDFs salvos como `docs/{id}/book.pdf`, `docs/{id}/tabela.pdf`, `docs/{id}/drive.pdf`

---

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Criar tabela `launches` + RLS + bucket storage |
| `src/pages/Launches.tsx` | **Novo** — Grid de cards dos lançamentos |
| `src/pages/LaunchDetail.tsx` | **Novo** — Página de detalhe com layout da imagem 1 |
| `src/pages/NewLaunch.tsx` | **Novo** — Formulário de cadastro com uploads |
| `src/App.tsx` | Adicionar 3 rotas |
| `src/components/Layout.tsx` | Link "Lançamentos" no menu desktop |
| `src/components/MobileMenu.tsx` | Link "Lançamentos" no menu mobile |

