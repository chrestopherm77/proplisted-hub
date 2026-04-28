## Adicionar marca d'água nos mockups de criativos

Hoje, no painel de Criativos, ao subir as imagens secundárias (mockups), o usuário escolhe a logo em 1 dos 4 cantos com opacidade 100%. Vamos adicionar:

1. **Toggle "Marca d'água"** por mockup (logo fica translúcida).
2. **Nova posição "centro"** — disponível tanto no modo normal quanto marca d'água (faz mais sentido como marca d'água, mas liberamos as duas).
3. **Slider de opacidade** quando marca d'água estiver ativa (padrão 35%).
4. **Tamanho maior** quando logo estiver no centro como marca d'água (~45% da largura, vs 18% nos cantos).

### Arquivos alterados

**`src/components/criativos/LogoPositionPicker.tsx`**
- Estender `LogoPosition` para incluir `'center'`.
- Adicionar 5ª área clicável central (sobreposta ao centro da imagem).
- Aceitar props novas: `watermark: boolean`, `opacity: number`, `onToggleWatermark`, `onOpacityChange`.
- Renderizar toggle "Marca d'água" + slider de opacidade abaixo do picker.
- Quando `watermark=true`, renderizar logo selecionada com `opacity` aplicada e tamanho ampliado se posição for `center`.

**`src/components/criativos/MockupPreview.tsx`** (renderização final no canvas)
- Receber `watermark` e `opacity`.
- Aplicar `ctx.globalAlpha = watermark ? opacity : 1` antes do `drawImage` da logo, e restaurar depois.
- Suporte à posição `center`: calcular `x = (img.width - lw) / 2`, `y = (img.height - lh) / 2`.
- Quando `watermark && position === 'center'`, usar `logoMaxW = img.width * 0.45` (logo grande como marca d'água clássica). Demais casos mantêm 18%.

**`src/components/criativos/wizard/StepImages.tsx`**
- Estender `ImageSlot`: adicionar `watermark: boolean` e `opacity: number` (defaults: `false`, `0.35`).
- Passar e atualizar esses campos via `LogoPositionPicker`.
- Atualizar texto de ajuda: "Clique nos cantos ou no centro para posicionar a logo. Ative 'Marca d'água' para deixar translúcida."

**Inicialização dos slots** (procurar onde `ImageSlot[]` é criado — provavelmente em `GenerateCreative.tsx`)
- Adicionar `watermark: false, opacity: 0.35` ao default de cada slot novo.

### Detalhes técnicos

- `LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'`
- Slider: shadcn `Slider` (já existe), range 10–80%.
- Toggle: shadcn `Switch` (já existe).
- Nada muda no banco — esses estados vivem apenas no wizard até a geração final do mockup (canvas → upload).

### Fora de escopo

- Não muda a imagem principal (gerada por IA) — marca d'água continua só nos secundários.
- Não muda o fluxo do `MyBrand` nem o upload de logo.
