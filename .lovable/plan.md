

## Plano: Download CSV de Corretores e Leads com filtro de data

### 1. Botão "Exportar CSV" na aba Usuários (`UsersManagement.tsx`)

- Adicionar botão "Exportar CSV" ao lado do campo de busca
- Gera CSV com colunas: Nome, E-mail, Telefone, Tipo (PF/PJ), CPF/CNPJ, Profissão, Registro, UF, Cidade, Bairro, Status, Data Cadastro
- Exporta os dados filtrados (respeitando a busca atual)
- Download automático no navegador via `Blob` + `URL.createObjectURL`

### 2. Filtro de período + Botão "Exportar CSV" na aba Leads (`LeadsManagement.tsx`)

- Adicionar um `Select` com opções de período: "Todos", "Últimos 7 dias", "Últimos 15 dias", "Últimos 20 dias", "Últimos 30 dias"
- Filtrar os leads exibidos pelo período selecionado (baseado em `created_at`)
- Adicionar botão "Exportar CSV" que exporta os leads filtrados
- Colunas do CSV: Nome, Telefone, Descrição, Preço, Vendas, Max Vendas, Promoção, Status, Data Cadastro

### Detalhes técnicos

- Lógica de geração CSV pura no frontend (sem edge function), usando os dados já carregados
- Função utilitária para converter array de objetos em string CSV com encoding UTF-8 BOM (compatível com Excel pt-BR)
- Ambos os componentes usam `document.createElement('a')` para trigger do download

### Arquivos modificados
- `src/components/admin/UsersManagement.tsx` — botão exportar CSV
- `src/components/admin/LeadsManagement.tsx` — filtro de período + botão exportar CSV

