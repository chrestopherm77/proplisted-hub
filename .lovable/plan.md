
# Diagnóstico e correção do erro da Calculadora

## Causa
A edge function chamou a API e ela respondeu **HTTP 500 com `{ message: "Server Error" }`** — erro genérico do servidor externo (Laravel). Provavelmente um destes:
1. **Município sem tabela cadastrada** — mesmo em UF coberta, alguns municípios não têm dados (causa exceção interna na API deles).
2. **Formato dos campos numéricos** — a API pode esperar `valor_imovel` como string crua (`"150000"` ou `"150000.00"`) e estar quebrando por algum detalhe.
3. **Mensagem de erro genérica não chega ao usuário** — hoje a função propaga status 500, e o `supabase.functions.invoke` no frontend perde o body do erro, mostrando só "Tente novamente".

## O que vou fazer

### 1. Refatorar `supabase/functions/calculate-emoluments/index.ts`
- **Sempre retornar HTTP 200** com payload `{ ok: boolean, data?, error?, upstreamStatus?, upstreamBody? }` (padrão recomendado para edge functions, evita perda do body no client).
- **Logar o body exato enviado** (codigo_municipio, consulta_id, valor_imovel) para facilitar debug nos próximos erros.
- **Logar o response cru** da API externa.
- **Mensagem de erro amigável** quando a API retornar 500: "A Calculadora externa não conseguiu processar (município pode não ter tabela cadastrada). Tente outro município."
- Manter validação Zod e CORS.

### 2. Ajustar `src/pages/Calculadora.tsx`
- Tratar o novo formato `{ ok, data, error }` da edge function.
- Mostrar a mensagem de erro detalhada vinda do servidor no toast (em vez do genérico "Tente novamente").
- Em modo desenvolvimento/admin, exibir também `upstreamStatus` e `upstreamBody` no card de resultado para inspeção.

### 3. Teste
Após deploy, testar com município comprovadamente coberto (ex: São Paulo capital, IBGE `3550308`, valor `500000`, consulta 1). Se ainda der 500, teremos o body exato logado para entender o que a API deles realmente quer.

## Arquivos
- editar `supabase/functions/calculate-emoluments/index.ts`
- editar `src/pages/Calculadora.tsx`
