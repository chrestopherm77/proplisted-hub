
## Corrigir nomes dos modelos de imagem da IA

O erro acontece porque o gateway não aceita `google/gemini-3-flash-image-preview` — esse nome não existe. Os modelos válidos para geração de imagem são outros.

### O que será feito

**1. Atualizar opções de modelo no admin (`CreativeStylesManagement.tsx`)**

Trocar as opções do `Select` de modelo para usar apenas modelos de imagem válidos do gateway:

- `google/gemini-2.5-flash-image` — **Nano Banana (Flash)** — rápido e barato (~$0,04/img)
- `google/gemini-3.1-flash-image-preview` — **Nano Banana 2 (Flash novo)** — rápido com qualidade pro
- `google/gemini-3-pro-image-preview` — **Nano Banana Pro** — máxima qualidade (~$0,14/img)

**2. Atualizar default no banco**

Migration para trocar o default da coluna `ai_model` em `creative_styles` de `google/gemini-3-flash-image-preview` (inválido) para `google/gemini-2.5-flash-image` (válido), e atualizar todas as linhas existentes que estão com o valor inválido.

**3. Atualizar fallback na edge function (`generate-creative-image/index.ts`)**

Trocar o fallback hardcoded:
```ts
const aiModel = style?.ai_model || generalRow?.ai_model || "google/gemini-2.5-flash-image";
```

### Resultado

Após o fix, ao clicar em "Tentar novamente", a geração funcionará. O padrão continua sendo Flash (barato), e você pode escolher Pro estilo a estilo no admin.
