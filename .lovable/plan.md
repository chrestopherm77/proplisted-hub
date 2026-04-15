

# Ajustes no sistema de Leads e Créditos

## Resumo
Seis mudanças distintas: atualizar pacotes de créditos no banco, limpar cards de créditos na UI, mover envio de email para após confirmação WhatsApp, remover data de cadastro dos cards de leads, e precificação dinâmica por intenção.

---

## 1. Atualizar pacotes de créditos (banco de dados)

Usar o insert tool para UPDATE nos 6 pacotes existentes com os novos valores:

| Preço | Créditos | Nome sugerido |
|-------|----------|---------------|
| R$ 28 | 140 | 140 Créditos |
| R$ 125 | 700 | 700 Créditos |
| R$ 220 | 1.400 | 1.400 Créditos |
| R$ 300 | 2.100 | 2.100 Créditos |
| R$ 475 | 3.500 | 3.500 Créditos |
| R$ 850 | 7.000 | 7.000 Créditos |

Remover coluna `lead_count` da lógica (não deletar coluna, apenas ignorar).

## 2. Limpar cards de créditos na UI

**`src/pages/BuyCredits.tsx`**:
- Remover a linha `~R$ X,XX por lead` (linha 288-290)
- Remover cálculo de `costPerLead` (linha 262)
- Alterar lógica de `bestValueIdx` para fixar no pacote de R$ 220 (1.400 créditos) ao invés de calcular por custo/crédito
- Remover referências a `lead_count` no texto

## 3. Remover data de cadastro dos cards de leads

**`src/pages/Leads.tsx`** (linhas 537-541):
- Remover o bloco que exibe "Cadastrado em DD/MM/AAAA" nos cards do marketplace

## 4. Email de novo lead só após confirmação WhatsApp

Atualmente o `notify-new-lead` é chamado no `LeadFormWizard.tsx` (linha 667) logo após o envio do formulário, antes da confirmação WhatsApp.

**`src/components/leadform/LeadFormWizard.tsx`** (linhas 658-679):
- Remover a chamada `supabase.functions.invoke('notify-new-lead', ...)` daqui

**`supabase/functions/mega-webhook/index.ts`**:
- No handler que processa a confirmação WhatsApp (quando ativa o lead com `is_active: true`), adicionar chamada ao `notify-new-lead` com os dados do lead (buscar do banco `form_data`, `description`, etc.)

## 5. Precificação dinâmica por intenção

**`src/components/leadform/LeadFormWizard.tsx`**:
- Substituir `DEFAULT_LEAD_PRICE = 27` por um mapa:
```text
BUY: 140 (créditos) → price = 140
RENT: 110 → price = 110
SELL: 110 → price = 110
BUILD: 120 → price = 120
```
- O campo `price` no banco é em créditos (já usado assim no `purchase_lead_with_credits`), então enviar o valor em créditos diretamente.

**`supabase/functions/merge-or-create-lead/index.ts`** (linha 205):
- Usar `defaultPrice` recebido do frontend (já faz isso), apenas garantir que o fallback seja 140 ao invés de 27.

---

## Detalhes técnicos

### Arquivos modificados:
1. `src/pages/BuyCredits.tsx` — remover custo/lead, fixar tag "melhor custo-benefício" em R$ 220
2. `src/pages/Leads.tsx` — remover data de cadastro
3. `src/components/leadform/LeadFormWizard.tsx` — precificação por intenção, remover notify-new-lead
4. `supabase/functions/merge-or-create-lead/index.ts` — fallback price 140
5. `supabase/functions/mega-webhook/index.ts` — chamar notify-new-lead após confirmação WhatsApp
6. **Banco**: UPDATE nos 6 registros de `credit_packages`

### Dados do banco (via insert tool):
```sql
UPDATE credit_packages SET name='140 Créditos', price=28, credits=140, lead_count=1 WHERE id='5b76822c-...';
-- (repetir para os 6 pacotes)
```

