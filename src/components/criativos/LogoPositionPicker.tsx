import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

interface Props {
  imageUrl: string;
  logoUrl?: string | null;
  position: LogoPosition;
  onChange: (pos: LogoPosition) => void;
  watermark?: boolean;
  opacity?: number;
  onToggleWatermark?: (v: boolean) => void;
  onOpacityChange?: (v: number) => void;
}

const POSITIONS: { id: LogoPosition; cls: string }[] = [
  { id: 'top-left', cls: 'top-2 left-2' },
  { id: 'top-right', cls: 'top-2 right-2' },
  { id: 'bottom-left', cls: 'bottom-2 left-2' },
  { id: 'bottom-right', cls: 'bottom-2 right-2' },
  { id: 'center', cls: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' },
];

export function LogoPositionPicker({
  imageUrl,
  logoUrl,
  position,
  onChange,
  watermark = false,
  opacity = 0.35,
  onToggleWatermark,
  onOpacityChange,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
        <img src={imageUrl} alt="Mockup" className="w-full h-full object-cover" />
        {POSITIONS.map((p) => {
          const active = p.id === position;
          const isCenter = p.id === 'center';
          const sizeCls = isCenter && watermark ? 'w-1/2 aspect-square' : 'w-1/4 aspect-square';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={cn(
                'absolute rounded border-2 transition-all flex items-center justify-center',
                p.cls,
                sizeCls,
                active
                  ? 'border-primary bg-primary/20 ring-2 ring-primary'
                  : 'border-white/60 bg-background/40 hover:bg-background/60'
              )}
            >
              {active && logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="max-w-[80%] max-h-[80%] object-contain"
                  style={{ opacity: watermark ? opacity : 1 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {onToggleWatermark && (
        <div className="flex items-center justify-between gap-2 px-1">
          <Label className="text-xs cursor-pointer">Marca d'água</Label>
          <Switch checked={watermark} onCheckedChange={onToggleWatermark} />
        </div>
      )}

      {watermark && onOpacityChange && (
        <div className="space-y-1 px-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Opacidade</Label>
            <span className="text-xs text-muted-foreground">{Math.round(opacity * 100)}%</span>
          </div>
          <Slider
            min={10}
            max={80}
            step={5}
            value={[Math.round(opacity * 100)]}
            onValueChange={(v) => onOpacityChange(v[0] / 100)}
          />
        </div>
      )}
    </div>
  );
}
