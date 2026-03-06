

## Correções nos filtros do Marketplace

### Problema 1: Filtro de cidade retornando bairro

O campo `region` no `form_data` tem o formato `"Bairro - Cidade/UF"` (ex: `"indiferente - Ribeirão Preto/SP"`). A função `extractCity` faz `region.split(/[\/\-,]/)[0]`, que retorna `"indiferente"` (o bairro) ao invés de `"Ribeirão Preto"`.

**Correção em `src/pages/Leads.tsx`:**

Reescrever `extractCity` para extrair corretamente a cidade. Também usar os campos diretos do `form_data` (`buy.city`, `rent.city`, etc.) como fonte primária, recorrendo ao parsing do `region` apenas como fallback. Mesma lógica para `extractUF`.

Nova abordagem:
```
function extractCity(formData): 
  1. Tentar formData[intention].city (campo direto)
  2. Fallback: parsear region "Bairro - Cidade/UF" → extrair entre último "-" e "/"
```

### Problema 2: Faixas de valor para Alugar

Atualmente as faixas de valor são fixas para compra/venda (100k, 250k, 500k, 1M). Para leads de aluguel, as faixas precisam ser diferentes.

**Novas faixas para RENT:**
- Até R$ 1.000
- R$ 1.000 - R$ 3.000
- R$ 3.000 - R$ 5.000
- R$ 5.000 - R$ 9.000
- Acima de R$ 10.000

**Implementação:** Quando `tempObjective === 'RENT'`, exibir as faixas de aluguel no select de valor. Caso contrário, manter as faixas atuais. Resetar o filtro de valor ao trocar o objetivo.

### Arquivos alterados
- `src/pages/Leads.tsx` — corrigir `extractCity`, adicionar faixas de valor condicionais por objetivo

