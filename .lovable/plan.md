

# Plano: Reformular formulário "Interesse do Comprador"

## Mudanças

### 1. Migração de banco de dados
Adicionar colunas `value_min` e `value_max` na tabela `property_searches` (text, nullable). Manter a coluna `value` existente para compatibilidade.

### 2. Remover campos Título e Headline
- Remover inputs de "Título do Imóvel" e "Headline" do formulário
- O título será gerado automaticamente pela concatenação dos campos preenchidos (ex: "Casa - Condomínio - Venda - São Paulo/SP - Centro - 3 quartos")
- O título é salvo automaticamente no campo `title` ao submeter

### 3. Estado e Cidade via API IBGE
- Usar o hook `useIBGELocation` já existente no projeto
- Estado: Select com todos os estados brasileiros (carregados da API IBGE)
- Cidade: Select populado dinamicamente ao selecionar o estado

### 4. Zona como Select
- Transformar o campo "Zona" de input texto para Select com opções:
  - Norte, Sul, Leste, Oeste, Centro, Rural

### 5. Valor com mínimo e máximo
- Substituir o campo único "Valor (R$)" por dois campos: "Valor Mínimo (R$)" e "Valor Máximo (R$)"
- Ambos com formatação de moeda
- Salvar nos novos campos `value_min` e `value_max`

### 6. Quartos condicional por tipo
- Mostrar campo "Quartos" apenas para: CASA e APARTAMENTO
- Ocultar para: SALA_COMERCIAL, LOTE, RURAL, PREDIO_COMERCIAL
- Adicionar `hasBedrooms` ao `fieldConfigs`

### 7. Prédio Comercial com garagem
- Alterar `fieldConfigs` para `PREDIO_COMERCIAL` ter `hasParking: true`

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `property_searches` (migração) | Adicionar colunas `value_min`, `value_max` |
| `src/pages/NewPropertySearch.tsx` | Todas as mudanças de formulário acima |

