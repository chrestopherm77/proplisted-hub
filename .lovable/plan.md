

## Unificação de Leads por Telefone — Preferência 1, Preferência 2

### Problema
Quando a mesma pessoa preenche o formulário duas vezes (ex: quer comprar E alugar), o sistema cria dois leads separados. O correto é unificar em um único lead com múltiplas preferências na descrição.

### Solução

**Arquivo: `src/components/leadform/LeadFormWizard.tsx`** (lógica de submissão, ~linhas 615-665)

Antes de inserir um novo lead, verificar se já existe um lead ativo com o mesmo telefone (normalizado):

1. **Buscar lead existente** pelo telefone na tabela `leads` (`phone` normalizado, `is_active = true`)
2. **Se existir**: atualizar o lead existente:
   - Contar quantas preferências já existem na descrição (parsear "Preferência N")
   - Adicionar nova seção "Preferência N+1" à descrição
   - Fazer merge do `form_data` (adicionar o novo fluxo ao JSON existente)
   - Criar novo `lead_submissions` normalmente (manter histórico)
   - **Não criar novo lead** — apenas `UPDATE` no existente
3. **Se não existir**: comportamento atual (criar novo lead), mas prefixar descrição com "Preferência 1:"

**Arquivo: `src/lib/formatFormData.ts`**

- Criar função `generatePreferenceDescription(data, preferenceNumber)` que gera a descrição com prefixo "Preferência N:"
- Criar função `mergeDescriptions(existingDescription, newDescription, newPrefNumber)` que concatena as seções

**Lógica de merge da descrição:**
```text
Preferência 1:
Interesse: Comprar imóvel
Região: Ribeirão Preto
Características: Residencial, Casa, 3 quarto(s)

Preferência 2:
Interesse: Alugar
Região: Ribeirão Preto
Características: Residencial, Apartamento, 2 quarto(s)
```

**Lógica de merge do `form_data`:**
- O `form_data` existente terá apenas o fluxo da primeira preferência (ex: `buy`)
- Adicionar o novo fluxo (ex: `rent`) ao mesmo objeto JSON
- Se for a mesma intenção repetida, armazenar como array ou substituir

**RLS**: O `leads` table permite INSERT anônimo mas não UPDATE anônimo. Será necessário adicionar uma policy de UPDATE para permitir a atualização por telefone, ou usar uma edge function com service role para fazer o merge.

### Abordagem recomendada: Edge Function

Para evitar complicações com RLS (anon não pode fazer SELECT/UPDATE em `leads`), criar uma edge function `merge-or-create-lead` que:
1. Recebe os dados do formulário
2. Busca lead existente pelo telefone (usando service role)
3. Faz merge ou cria novo
4. Retorna o `leadId` para o frontend

### Arquivos alterados
- **Nova edge function**: `supabase/functions/merge-or-create-lead/index.ts`
- **`src/components/leadform/LeadFormWizard.tsx`**: substituir insert direto por chamada à edge function
- **`src/lib/formatFormData.ts`**: adicionar funções de formatação com prefixo de preferência

