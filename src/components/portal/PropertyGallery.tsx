import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { sortPhotos, type PropertyPhoto } from '@/lib/propertyUtils';

interface PropertyGalleryProps {
  photos: PropertyPhoto[];
}

export function PropertyGallery({ photos }: PropertyGalleryProps) {
  const sorted = sortPhotos(photos || []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const prev = useCallback(
    () => setActiveIdx((i) => (i === 0 ? sorted.length - 1 : i - 1)),
    [sorted.length],
  );
  const next = useCallback(
    () => setActiveIdx((i) => (i === sorted.length - 1 ? 0 : i + 1)),
    [sorted.length],
  );

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, prev, next]);

  if (sorted.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        <ImageIcon className="h-16 w-16" />
      </div>
    );
  }

  const active = sorted[activeIdx];

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx > 0) prev();
      else next();
    }
    setTouchStartX(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block w-full h-full"
          aria-label="Abrir foto em tela cheia"
        >
          <img
            src={active.url}
            alt={`Foto ${activeIdx + 1}`}
            className="w-full h-full object-cover cursor-zoom-in"
          />
        </button>
        {sorted.length > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-90"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-90"
              onClick={(e) => { e.stopPropagation(); next(); }}
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
              onClick={() => { setActiveIdx(idx); setLightboxOpen(true); }}
              className={`shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                idx === activeIdx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={p.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-[100vw] w-screen h-screen sm:max-w-[100vw] p-0 border-0 bg-black/95 rounded-none gap-0 [&>button]:hidden"
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-2"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/10 text-white text-sm px-3 py-1 rounded-full">
              {activeIdx + 1} / {sorted.length}
            </div>

            <img
              src={active.url}
              alt={`Foto ${activeIdx + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />

            {sorted.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white p-3"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white p-3"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
