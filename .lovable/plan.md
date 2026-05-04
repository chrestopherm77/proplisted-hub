## Objetivo

Comprimir e converter as fotos do Portal de Imóveis para **WebP** no navegador antes do upload, reduzindo o tamanho em pelo menos ~50% sem perda visual relevante.

## Mudanças

### 1. Novo helper `src/lib/imageCompression.ts`

Função `compressImage(file, opts)` que:

- Carrega a imagem em um `<img>` via `URL.createObjectURL`.
- Redimensiona via `<canvas>` para no máximo `1920px` no maior lado (preservando proporção).
- Re-encoda em **WebP** com qualidade inicial `0.82`.
- Se o resultado não ficar ≥50% menor que o original, tenta qualidades decrescentes (0.78 → 0.5) até atingir o alvo.
- Pula GIF/SVG e arquivos não-imagem (retorna o original).
- Se o navegador não suportar `image/webp` no `canvas.toBlob` (raro: Safari < 14), faz fallback para JPEG `0.82`.
- Se mesmo após compressão ficar maior que o original (imagem já otimizada), retorna o arquivo original.

### 2. Integrar no `src/components/portal/PropertyPhotosUpload.tsx`

- Importar `compressImage`.
- No loop de upload, antes de enviar pro Supabase Storage, chamar `compressImage(original, { maxDimension: 1920, initialQuality: 0.82, targetRatio: 0.5, outputType: 'image/webp' })`.
- Trocar a extensão para `.webp` (ou `.jpg` no fallback) e passar `contentType: file.type` no upload.
- Atualizar o texto do dropzone: "as imagens são otimizadas e convertidas para WebP automaticamente para carregar mais rápido".
- Em caso de erro na compressão, fallback para o arquivo original.

### 3. Sem mudanças no banco / storage

Roda 100% no client. O bucket `properties` já é público; estrutura `photos` (jsonb) não muda. As fotos antigas continuam funcionando normalmente.

## Detalhes técnicos

- WebP normalmente entrega ~25–35% a mais de economia que JPEG na mesma qualidade visual — combinado com o resize para 1920px, fotos de celular (3–8 MB) costumam cair para 80–400 KB.
- `targetRatio: 0.5` = "tentar chegar em ≤50% do tamanho original".
- Fallback para JPEG só dispara se `canvas.toBlob('image/webp', ...)` retornar `null`.