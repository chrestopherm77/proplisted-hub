import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sortPhotos, type PropertyPhoto } from '@/lib/propertyUtils';

interface PropertyGalleryProps {
  photos: PropertyPhoto[];
}

export function PropertyGallery({ photos }: PropertyGalleryProps) {
  const sorted = sortPhotos(photos || []);
  const [activeIdx, setActiveIdx] = useState(0);

  if (sorted.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        <ImageIcon className="h-16 w-16" />
      </div>
    );
  }

  const active = sorted[activeIdx];
  const prev = () => setActiveIdx((i) => (i === 0 ? sorted.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === sorted.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <img
          src={active.url}
          alt={`Foto ${activeIdx + 1}`}
          className="w-full h-full object-cover"
        />
        {sorted.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-90"
              onClick={prev}
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-90"
              onClick={next}
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="absolute bottom-2 right-2 bg-background/80 text-foreground text-xs px-2 py-1 rounded">
              {activeIdx + 1} / {sorted.length}
            </div>
          </>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sorted.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                idx === activeIdx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={p.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
