

# Plano: Melhorias na aba de Lançamentos

## 1. Migração de banco de dados

Adicionar novas colunas na tabela `launches`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `logo_url` | text | Logo do empreendimento |
| `property_type` | text | Tipo (casa, apto, terreno) |
| `size_m2_min` | text | Tamanho mínimo m² |
| `size_m2_max` | text | Tamanho máximo m² |
| `status` | text | Lançamento / Em construção / Entregue |
| `price_max` | text | Preço máximo (já existe price_from para mín) |
| `coordinator_phone2` | text | Segundo telefone do coordenador |
| `drive_link` | text | Link externo do Drive (em vez de PDF) |

## 2. Listagem (`Launches.tsx`) - Novos filtros

Adicionar filtros além do existente (cidade + busca):
- **Estado** — Select dinâmico dos estados existentes
- **Zona** — Select dinâmico
- **Tamanho m²** — Inputs de/até
- **Tipo** — Select: Casa, Apartamento, Terreno
- **Preço** — Inputs mín/máx
- **Status** — Select: Lançamento, Em construção, Entregue

**Cards**: Abaixo do nome, mostrar resumo: cidade, zona, status, valor, tipo, m²

## 3. Formulário (`NewLaunch.tsx`) - Melhorias

- Adicionar upload de **Logo** (além do banner)
- Adicionar campo **Status** (Select: Lançamento / Em construção / Entregue)
- Adicionar campo **Tipo** (Select: Casa, Apto, Terreno)
- Adicionar campos **Tamanho m²** (mín/máx)
- Adicionar campo **Preço máximo** (além do "A partir de")
- Renomear "Coordenador" para **"Coordenador de Vendas"**
- Adicionar **segundo telefone** do coordenador
- Na seção de arquivos: Book e Tabela aceitam **PDF ou Link**, Drive aceita apenas **Link**
- Adicionar botão **"Excluir Empreendimento"** (com confirmação)

## 4. Detalhe (`LaunchDetail.tsx`)

- Exibir **logo** ao lado do banner
- Exibir **todas as informações** novas (status, tipo, m², preço máx)
- Coordenador de Vendas com dois telefones (dois botões WhatsApp)
- Drive como link externo
- Botão de **excluir empreendimento** (com confirmação)

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `launches` (migração) | 8 novas colunas |
| `src/pages/Launches.tsx` | Filtros + resumo nos cards |
| `src/pages/NewLaunch.tsx` | Logo, status, tipo, m², preço máx, 2o telefone, PDF/link, excluir |
| `src/pages/LaunchDetail.tsx` | Exibir todas as novas informações, excluir |

