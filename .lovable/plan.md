
# Redesign da Calculadora de Emolumentos

## Resumo
Refatorar a página `/calculadora` para seguir o fluxo visual da calculadora oficial (imagens enviadas): fluxo em etapas, cards de tipo de serviço, formulário condicional por tipo, e tabela de resultado formatada. Remover JSON cru e diagnóstico técnico da interface do usuário.

## Fluxo (igual às imagens)

**Etapa 1 — Localização + Texto introdutório**
- Texto: "A Calculadora de Emolumentos estima os custos do registro do imóvel de forma rápida, eficaz e gratuita. Desta forma não é necessário se deslocar até o cartório para realizar a previsão do preço do registro do imóvel. Caso o negócio jurídico envolva mais de um imóvel, deve ser realizado um cálculo separado para cada um dos imóveis. O valor definitivo será calculado pelo respectivo Registro de Imóveis após o protocolo."
- Selects lado a lado: UF e Município

**Etapa 2 — Tipo de serviço (cards)**
Título: "Escolha o tipo de serviço a calcular"
3 cards clicáveis (ícones Lucide: `Building2`, `Landmark`, `FileText`):
1. **Registro em Geral** — "Registro de Compra e Venda e outros" (`consulta_id=1`)
2. **Registro de Compra e Venda com Alienação Fiduciária** — "Registro de Contrato de Compra com Alienação Fiduciária (com financiamento)" (`consulta_id=2`)
3. **Averbação com Valor Econômico** (`consulta_id=3`)

Aparece após UF+Município preenchidos.

**Etapa 3 — Formulário condicional**
Título dinâmico: "Registro em Geral (UF - Município)" ou "Registro de Compra e Venda com Alienação Fiduciária (UF - Município)"
- Sempre: `Valor do imóvel / Transação` (máscara BRL)
- **Apenas para `consulta_id=2`**: `Valor do financiamento` (máscara BRL)
- Botão expansível "Possui Desconto?" → revela input de código
- Botão "Calcular"
- Coluna direita: bloco "Observações importantes" com texto contextual ao tipo

**Etapa 4 — Resultado (tabela)**
Renderizar tabela com colunas:
`Descrição | Emolumento | Tribunal de Justiça - 10% | Defensoria - 5% | Ministério Público - 5% | Procuradoria - 5% | Subtotal`
- Linhas vindas do array de itens da resposta
- Linha "SUBTOTAIS" em negrito
- Linha ISS
- Linha "TOTAL" destacada (cor primária, valor grande à direita)

## Mudanças técnicas

### `src/pages/Calculadora.tsx` — reescrever
- Estado de etapa: `location | service | form | result`
- Componente de card de serviço reutilizável
- **Remover** o accordion de JSON cru e o card "Diagnóstico técnico" da UI
- Manter logs no console (não na tela) para debug
- Botão "Voltar" entre etapas para refazer cálculo
- Renderização da tabela com `Table` do shadcn

### Mapeamento da resposta da API
Como ainda não temos o schema confirmado, vou adotar abordagem defensiva:
- Tentar ler `data.itens` / `data.linhas` / `data.servicos` (array)
- Cada linha esperada: `{ descricao, emolumento, tj, defensoria, mp, procuradoria, subtotal }` com fallback de chaves comuns (snake_case e camelCase)
- Total: `data.total` ou somatório
- Se schema vier diferente, ajustamos após primeiro retorno real (logs do console mostrarão tudo)

### Edge function
Sem alterações — já retorna `{ ok, data, ... }` corretamente.

## Arquivos
- editar `src/pages/Calculadora.tsx` (reescrita completa do JSX)
