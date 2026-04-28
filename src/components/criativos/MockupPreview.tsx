import { useEffect, useRef } from 'react';
import type { LogoPosition } from './LogoPositionPicker';

interface Props {
  imageUrl: string;
  logoUrl?: string | null;
  position: LogoPosition;
  watermark?: boolean;
  opacity?: number;
  className?: string;
  onReady?: (dataUrl: string) => void;
}

export function MockupPreview({
  imageUrl,
  logoUrl,
  position,
  watermark = false,
  opacity = 0.35,
  className,
  onReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const finish = () => {
        try { onReady?.(canvas.toDataURL('image/jpeg', 0.9)); } catch { /* tainted */ }
      };

      if (!logoUrl) return finish();
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const isCenterWatermark = watermark && position === 'center';
        const widthFactor = isCenterWatermark ? 0.45 : 0.18;
        const logoMaxW = img.width * widthFactor;
        const ratio = logo.width > 0 ? logoMaxW / logo.width : 1;
        const lw = logo.width * ratio;
        const lh = logo.height * ratio;
        const pad = img.width * 0.025;
        let x = pad, y = pad;
        if (position === 'top-right') { x = img.width - lw - pad; y = pad; }
        if (position === 'bottom-left') { x = pad; y = img.height - lh - pad; }
        if (position === 'bottom-right') { x = img.width - lw - pad; y = img.height - lh - pad; }
        if (position === 'center') { x = (img.width - lw) / 2; y = (img.height - lh) / 2; }

        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = watermark ? opacity : 1;
        ctx.drawImage(logo, x, y, lw, lh);
        ctx.globalAlpha = prevAlpha;
        finish();
      };
      logo.onerror = finish;
      logo.src = logoUrl;
    };
    img.src = imageUrl;
  }, [imageUrl, logoUrl, position, watermark, opacity, onReady]);

  return <canvas ref={canvasRef} className={className} />;
}
