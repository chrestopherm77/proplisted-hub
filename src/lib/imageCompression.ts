/**
 * Compressor de imagens client-side usando canvas.
 * Reduz tamanho do arquivo em ≥50% e converte para WebP por padrão.
 */

export interface CompressOptions {
  maxDimension?: number;
  initialQuality?: number;
  targetRatio?: number;
  outputType?: 'image/webp' | 'image/jpeg';
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1920,
  initialQuality: 0.82,
  targetRatio: 0.5,
  outputType: 'image/webp',
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const o = { ...DEFAULTS, ...opts };

  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }

  const longest = Math.max(img.width, img.height);
  const scale = longest > o.maxDimension ? o.maxDimension / longest : 1;
  const tw = Math.round(img.width * scale);
  const th = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  // Fundo branco para JPEG (ignorado em WebP, que suporta alpha)
  if (o.outputType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tw, th);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, tw, th);

  // Detecta suporte a WebP — se canvas.toBlob('image/webp') retornar null, cai pra JPEG
  let outputType = o.outputType;
  const probe = await canvasToBlob(canvas, outputType, o.initialQuality);
  if (!probe && outputType === 'image/webp') {
    outputType = 'image/jpeg';
    // Pinta fundo branco antes de re-renderizar (JPEG não suporta alpha)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tw, th);
    ctx.drawImage(img, 0, 0, tw, th);
  }

  const targetSize = Math.floor(file.size * o.targetRatio);
  const qualities = [o.initialQuality, 0.78, 0.72, 0.66, 0.6, 0.55, 0.5];
  let best: Blob | null = probe && outputType === o.outputType ? probe : null;

  for (const q of qualities) {
    const blob = await canvasToBlob(canvas, outputType, q);
    if (!blob) continue;
    if (!best || blob.size < best.size) best = blob;
    if (blob.size <= targetSize) { best = blob; break; }
  }

  if (!best) return file;
  if (best.size >= file.size) return file;

  const ext = outputType === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([best], `${baseName}.${ext}`, {
    type: outputType,
    lastModified: Date.now(),
  });
}
