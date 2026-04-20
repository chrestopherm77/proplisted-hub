import { cn } from '@/lib/utils';

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface Props {
  imageUrl: string;
  logoUrl?: string | null;
  position: LogoPosition;
  onChange: (pos: LogoPosition) => void;
}

const POSITIONS: { id: LogoPosition; cls: string }[] = [
  { id: 'top-left', cls: 'top-2 left-2' },
  { id: 'top-right', cls: 'top-2 right-2' },
  { id: 'bottom-left', cls: 'bottom-2 left-2' },
  { id: 'bottom-right', cls: 'bottom-2 right-2' },
];

export function LogoPositionPicker({ imageUrl, logoUrl, position, onChange }: Props) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
      <img src={imageUrl} alt="Mockup" className="w-full h-full object-cover" />
      {POSITIONS.map((p) => {
        const active = p.id === position;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={cn(
              'absolute w-1/4 aspect-square rounded border-2 transition-all flex items-center justify-center',
              p.cls,
              active
                ? 'border-primary bg-primary/20 ring-2 ring-primary'
                : 'border-white/60 bg-background/40 hover:bg-background/60'
            )}
          >
            {active && logoUrl && (
              <img src={logoUrl} alt="Logo" className="max-w-[80%] max-h-[80%] object-contain" />
            )}
          </button>
        );
      })}
    </div>
  );
}
