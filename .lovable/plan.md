
## Trocar padrão para Nano Banana 2 (Flash novo)

Mudar o modelo padrão global de `google/gemini-3-pro-image-preview` (Pro) para `google/gemini-3.1-flash-image-preview` (Nano Banana 2 / Flash novo) para você testar a qualidade.

### O que será feito

**1. Migration no banco**

Atualizar a tabela `creative_styles`:
- Mudar o `DEFAULT` da coluna `ai_model` para `google/gemini-3.1-flash-image-preview`
- Atualizar todas as linhas existentes para `google/gemini-3.1-flash-image-preview` (assim todos os estilos passam a usar Nano Banana 2)

**2. Atualizar fallback na edge function (`generate-creative-image/index.ts`)**

Trocar o fallback hardcoded de:
```ts
"google/gemini-3-pro-image-preview"
```
para:
```ts
"google/gemini-3.1-flash-image-preview"
```

### Resultado

- Próxima geração vai usar Nano Banana 2 (Flash novo)
- Qualidade próxima do Pro, mais rápido e mais barato
- Você continua podendo escolher Pro ou Flash básico em estilos específicos no admin
