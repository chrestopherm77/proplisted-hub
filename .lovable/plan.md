
# Calculadora de Emolumentos

## Resumo
Página `/calculadora` que consome a API externa `https://calculadora.registrodeimoveis.org.br/api/calculate` via Edge Function (protege o token Bearer e evita CORS).

## Implementação

### 1. Secret
Salvar `CALCULADORA_API_TOKEN = 126|jfYfQ8Ow4kC5efqs2KgS9ClY9OL1QGcs3dXb4KY8` como secret do projeto.

### 2. Edge Function `supabase/functions/calculate-emoluments/index.ts`
- `verify_jwt = true` (apenas usuários logados)
- Valida body com Zod: `codigo_municipio` (int), `consulta_id` (1|2|3), `valor_imovel` (float > 0), `valor_financiamento` (opcional, ≤ valor_imovel), `desconto` (opcional)
- Monta `FormData` (multipart/form-data) e faz `POST` para `https://calculadora.registrodeimoveis.org.br/api/calculate` com headers:
  - `Accept: application/json`
  - `Authorization: Bearer ${CALCULADORA_API_TOKEN}`
- Repassa o JSON da resposta (ou erro tratado) ao frontend
- CORS padrão Lovable

### 3. Página `src/pages/Calculadora.tsx`
Layout padrão (sidebar). Formulário com:
- **UF**: select fixo com os 11 estados cobertos (AM, BA, ES, GO, MG, MS, PA, PR, RJ, RS, SP)
- **Município**: select dinâmico via hook `useIBGELocation` (já existe) — envia o `id` IBGE como `codigo_municipio`
- **Tipo de consulta**: select (1, 2, 3) com labels descritivos
- **Valor do imóvel**: input com máscara monetária BRL
- **Valor do financiamento** (opcional): mesma máscara, validado ≤ valor do imóvel
- **Desconto** (opcional): input livre por enquanto (campo de código) — refinar depois quando você mandar a tabela
- Botão **Calcular** → `supabase.functions.invoke('calculate-emoluments', { body })`
- Card de resultado abaixo: exibe os valores principais formatados em R$ e o JSON cru em accordion para inspeção (já que ainda não conheço o schema exato da resposta — refino depois com base num retorno real)
- Toasts para erro

### 4. Roteamento e Navegação
- `src/App.tsx`: rota `/calculadora`
- `src/components/AppSidebar.tsx`: item "Calculadora" (ícone `Calculator`), visível para todo logado, oculto em sites parceiros
- `src/components/MobileMenu.tsx`: mesmo item

## Arquivos
- criar `supabase/functions/calculate-emoluments/index.ts`
- criar `src/pages/Calculadora.tsx`
- editar `src/App.tsx`, `src/components/AppSidebar.tsx`, `src/components/MobileMenu.tsx`
- adicionar secret `CALCULADORA_API_TOKEN`
