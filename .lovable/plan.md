

## Integração de IA — Geração da imagem principal com Nano Banana Pro

Vou plugar a geração da imagem **Principal** do criativo na API de imagens do Gemini (`google/gemini-3-pro-image-preview`, alias "Nano Banana Pro") via **Lovable AI Gateway** — sem precisar de chave de API: a `LOVABLE_API_KEY` já está disponível no projeto automaticamente.

### Sobre a chave de API

Você não precisa fornecer chave. O Lovable Cloud já injeta `LOVABLE_API_KEY` nas Edge Functions e isso dá acesso aos modelos Gemini (incluindo o Nano Banana Pro de imagem). Único custo: créditos de uso do Lovable AI (gratuito até o limite mensal, depois recarga em Workspace → Usage).

### Fluxo

```text
Usuário clica "Gerar criativos"
        │
        ▼
Insert em creatives (status=PENDING) ──► retorna creative_id
        │
        ▼
Frontend chama edge function generate-creative-image
        │
        ▼
Edge function:
  1. Busca creative + style.prompt + main_image (URL pública)
  2. Monta prompt = style.prompt + info_text + format hint (1:1 / 9:16 / 1.91:1)
  3. POST ai.gateway.lovable.dev/v1/chat/completions
     model: google/gemini-3-pro-image-preview
     content: [texto, image_url da principal]
     modalities: ["image","text"]
  4. Recebe base64 → faz upload para bucket "creatives"
  5. UPDATE creatives SET main_image_url=<novaURL>, status=READY
        │
        ▼
Frontend faz polling/refresh e mostra a imagem gerada em "Meus Criativos" e na tela de resultado
```

### O que muda

**Nova edge function: `supabase/functions/generate-creative-image/index.ts`**
- Auth: valida JWT do usuário (`getClaims`).
- Input: `{ creative_id }`.
- Lê `creatives` (confirma `user_id` = caller), `creative_styles` (pega `prompt`).
- Baixa a imagem principal da URL pública e converte para base64 data URL.
- Monta o prompt final juntando: `style.prompt` + `info_text` + instrução de formato (`POST → quadrado 1:1`, `STORIES → vertical 9:16`, `TRAFEGO → horizontal 1.91:1`).
- Chama o gateway com `model: "google/gemini-3-pro-image-preview"`, `modalities: ["image","text"]`, passando texto + imagem de referência.
- Trata 429 (rate limit) e 402 (créditos esgotados) retornando mensagens claras.
- Sobe a imagem retornada (base64) no bucket `creatives` em `<user_id>/ai-<creative_id>.png`.
- Atualiza `creatives` com `main_image_url`, `status=READY`. Em erro, `status=FAILED` + `error_message`.

**Migration leve: adicionar `error_message TEXT` em `creatives`** (para mostrar falha no card).

**Frontend — `GenerateCreative.tsx` / `StepResult.tsx`**
- Após `INSERT` em `creatives` (já existe), chamar `supabase.functions.invoke('generate-creative-image', { body: { creative_id } })` em background.
- `StepResult` recebe `creativeId` e faz **polling** (a cada 3s, max 90s) em `creatives` até `status=READY` ou `FAILED`.
- Estados visíveis no card "Principal":
  - **PENDING**: skeleton + "Gerando com IA…" com `Loader2`.
  - **READY**: mostra `main_image_url`.
  - **FAILED**: ícone de erro + mensagem + botão "Tentar novamente" (re-invoca a function).

**Frontend — `MyCreatives.tsx`**
- Card mostra o status (badge "Gerando…" se `PENDING`, "Falhou" se `FAILED`).
- Auto-refresh: assinar `postgres_changes` em `creatives` filtrado por `user_id` para refletir a conclusão sem F5.

### Detalhes técnicos do prompt

Estrutura enviada ao modelo:
```text
{style.prompt}

Imóvel: {info_text}

Formato: {POST=square 1:1 1080x1080 | STORIES=vertical 9:16 1080x1920 | TRAFEGO=landscape 1.91:1 1200x628}

Use a imagem de referência fornecida como base do imóvel. Mantenha a identidade visual do estilo. Texto na imagem em português, mínimo e legível. Sem watermarks.
```

Imagem de referência vai como segundo `content` item:
```json
{ "type": "image_url", "image_url": { "url": "https://.../upload-xxx.jpg" } }
```

### Tratamento de erros

- **402 (créditos)**: toast "Créditos de IA esgotados. Adicione créditos em Workspace → Usage." + status FAILED.
- **429 (rate limit)**: toast "Muitas gerações em sequência. Tente novamente em alguns segundos." + auto-retry uma vez após 5s.
- **Sem `main_image_url` selecionada**: pular a geração, status já fica vazio (mockups continuam funcionando).
- **Estilo sem prompt cadastrado**: fallback para prompt genérico "anúncio imobiliário profissional".

### Arquivos

**Novos**
- `supabase/functions/generate-creative-image/index.ts`

**Alterados**
- `src/components/criativos/GenerateCreative.tsx` (invoca a function após o insert, passa `creative_id` para o StepResult)
- `src/components/criativos/wizard/StepResult.tsx` (polling + estados PENDING/READY/FAILED + retry)
- `src/components/criativos/MyCreatives.tsx` (badge de status + realtime subscribe)
- Migration: `ALTER TABLE creatives ADD COLUMN error_message TEXT;` + `ALTER PUBLICATION supabase_realtime ADD TABLE public.creatives;`

### Observações

- Modelo **Nano Banana Pro** (`google/gemini-3-pro-image-preview`) é o de maior qualidade da família — mais lento e mais caro, mas é o que você pediu na documentação.
- Os 7 mockups continuam 100% client-side (canvas com a logo) — sem mudança lá.
- Os prompts editados pelo admin em "Estilos de Criativos" passam a ser **efetivamente usados** na geração.

