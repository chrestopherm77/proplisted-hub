## Diagnóstico

O erro **"Edge Function returned a non-2xx status code"** veio da edge `generate-creative-image`. Nos logs:

```
Gemini API error: 503 { "status": "UNAVAILABLE",
  "message": "This model is currently experiencing high demand..." }
```

O modelo configurado no estilo é o **`google/gemini-3-pro-image-preview`** (Nano Banana Pro), que é caro e está sobrecarregado no Google. Hoje a função:

1. Não tem retry — qualquer 503 quebra a geração.
2. Não faz fallback para um modelo mais leve (Flash / Nano Banana 2).
3. Já debitou os 10 créditos do usuário antes da chamada — em caso de falha 5xx, o crédito **não está sendo devolvido** (o usuário paga por uma falha do Google).
4. Mostra mensagem genérica "Falha ao gerar imagem com IA" sem orientar o usuário.

## Plano de correção (somente `supabase/functions/generate-creative-image/index.ts`)

1. **Retry com backoff** para erros transitórios (`503`, `429`, `500`):
   - até 2 tentativas extras (3 no total)
   - delay 1.5s → 4s

2. **Fallback de modelo** quando o Pro continuar indisponível após o retry:
   - se modelo era `gemini-3-pro-image-preview` → tenta `gemini-3.1-flash-image-preview`
   - registra no log qual modelo realmente gerou

3. **Reembolso de créditos** quando a IA falha por motivo do provedor (5xx/429 após esgotar retries+fallback):
   - chamar `admin.rpc("admin_adjust_credits", ...)` ou inserir crédito de volta via `credit_transactions` (vou usar o mesmo caminho atômico já existente — refund de `CREATIVE_COST` para o `userId`)
   - marcar criativo como `FAILED` com mensagem clara

4. **Mensagens user-friendly** por status:
   - `503` → "A IA está sobrecarregada no momento. Tentamos novamente automaticamente, mas falhou. Seus créditos foram devolvidos. Tente novamente em 1-2 minutos."
   - `429` → mantém atual
   - outros 5xx → "Erro temporário na IA. Créditos devolvidos."

5. **Status HTTP de retorno** vira `200` com `{ error, refunded: true }` para o frontend conseguir ler a mensagem (hoje retornar 503 dispara o toast genérico do supabase-js que esconde o body).

### Detalhe técnico do refund

Existe a função `consume_credits_for_creative` (débito atômico). Para o refund, vou usar `admin_adjust_credits` (já existe como edge function) **NÃO** — vou inserir direto via SQL chamando uma RPC já existente ou, se não houver, fazer um simples `update` em `user_credits` somando `CREATIVE_COST` + insert em `credit_transactions` com `type='REFUND'` e referência ao criativo. Vou verificar primeiro o schema durante a implementação para escolher o caminho mais limpo.

### Fora de escopo

- Não vou alterar a UI do `MyCreatives` / `StepResult` — o "Tentar novamente" já existe e vai pegar a nova mensagem.
- Não vou trocar o modelo padrão configurado pelo admin em `creative_styles` — só fazer fallback automático em runtime quando o Pro estiver fora.