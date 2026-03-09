

## Correção: Leads em Espera mostrando leads que já foram efetivados

### Problema
Leads como Hebert e Haline preencheram o formulário completo e se tornaram leads efetivos (existem em `lead_submissions`), mas continuam aparecendo na lista "Leads em Espera" porque o campo `completed` na tabela `lp_partial_leads` não foi marcado como `true`. Isso acontece quando o `update` client-side falha silenciosamente ou o formato do telefone não bate exatamente.

### Solução (dupla camada)

**1. Correção imediata dos dados existentes** (SQL via insert tool)
- Executar um UPDATE que marca como `completed = true` todos os registros em `lp_partial_leads` cujo telefone já existe em `lead_submissions`.

**2. Filtro server-side no componente LeadTracking**
- Após buscar os partial leads com `completed = false`, fazer uma segunda query em `lead_submissions` para obter todos os telefones de leads efetivos.
- Filtrar no frontend: remover da lista de "em espera" qualquer partial lead cujo telefone já conste em `lead_submissions`.
- Isso garante que mesmo se o `completed` não for atualizado, o lead não aparece como "em espera".

**3. Melhorar a marcação no LeadFormWizard**
- Normalizar o telefone (remover caracteres não numéricos) antes de fazer o `update` por telefone, para evitar falhas de matching por formatação.

### Arquivos alterados
- SQL: UPDATE em `lp_partial_leads` para limpar dados existentes
- `src/components/admin/LeadTracking.tsx`: adicionar cross-reference com `lead_submissions`
- `src/components/leadform/LeadFormWizard.tsx`: normalizar telefone no update de completed

