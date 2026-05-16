## Ajustes em `notify-property-match` (WhatsApp "novo lead com perfil do seu imóvel")

Dois ajustes pontuais na edge function `supabase/functions/notify-property-match/index.ts`. Sem mudanças de UI, sem migrations.

### 1. Corrigir formatação dos valores (real)

Os valores do lead form (`budgetMin`, `budgetMax`, `maxRent`) são salvos **em centavos mascarados** (ex: "R$ 350.000,00" → 35000000). Hoje a função faz `parseInt(digits)` e exibe direto, gerando algo como "R$ 35.000.000" no WhatsApp.

Correção:
- `parseMoney` passa a dividir por 100 quando o valor veio do form mascarado.
- `fmtMoney` formata com `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })`, resultando em "R$ 350.000".

Resultado esperado na mensagem: `R$ 300.000 a R$ 500.000` ou `até R$ 2.500/mês`.

### 2. Identificação do lead + link direto pro modal

A página `/leads` já abre o modal automaticamente quando recebe `?leadId=<uuid>` na URL (verificado em `src/pages/Leads.tsx` linha 192). Vamos aproveitar isso.

Mudanças na mensagem:
- Incluir uma **marcação curta do lead** no topo: `🆔 Lead #<8 primeiros chars do UUID em maiúsculo>` (mesmo padrão usado no `LeadDetailsModal`).
- Substituir o link genérico `https://www.conectaeimob.com.br/leads` por **link direto** que abre o modal do lead:  
  `https://www.conectaeimob.com.br/leads?leadId=<uuid>`

### Exemplo do novo texto

```
🎯 Novo lead com perfil pro seu imóvel!

Olá, João!

🆔 Lead #A1B2C3D4
Imóvel: Casa Jardim Sumaré (Ref: A0123)
Cidade: Ribeirão Preto

Acabou de chegar um lead em Ribeirão Preto interessado em COMPRAR
na faixa de R$ 300.000 a R$ 500.000.

Veja os detalhes e compre agora:
👉 https://www.conectaeimob.com.br/leads?leadId=8f3c...
```

### Fora de escopo
- Não altera `notify-alert-match`, `notify-lead-group`, nem nenhum outro disparo.
- Não muda lógica de matching, nem o frontend.