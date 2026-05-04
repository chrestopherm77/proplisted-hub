import { useState, useRef } from 'react';
import { Upload, X, Star, Loader2, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sortPhotos, type PropertyPhoto } from '@/lib/propertyUtils';
import { compressImage } from '@/lib/imageCompression';

interface PropertyPhotosUploadProps {
  userId: string;
  photos: PropertyPhoto[];
  onChange: (photos: PropertyPhoto[]) => void;
  max?: number;
}

export function PropertyPhotosUpload({ userId, photos, onChange, max = 30 }: PropertyPhotosUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIdx = useRef<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = max - photos.length;
    if (remaining <= 0) {
      toast({ title: 'Limite atingido', description: `Máximo de ${max} fotos.`, variant: 'destructive' });
      return;
    }

    const arr = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const uploaded: PropertyPhoto[] = [];
      const baseOrder = photos.length;

      for (let i = 0; i < arr.length; i++) {
        const original = arr[i];
        if (!original.type.startsWith('image/')) {
          toast({ title: 'Arquivo inválido', description: `${original.name} não é uma imagem.`, variant: 'destructive' });
          continue;
        }
        if (original.size > 20 * 1024 * 1024) {
          toast({ title: 'Arquivo muito grande', description: `${original.name} excede 20MB.`, variant: 'destructive' });
          continue;
        }

        // Comprime + converte para WebP no navegador antes de enviar
        let file = original;
        try {
          file = await compressImage(original, {
            maxDimension: 1920,
            initialQuality: 0.82,
            targetRatio: 0.5,
            outputType: 'image/webp',
          });
        } catch (err) {
          console.warn('Falha ao comprimir, enviando original:', err);
        }

        const ext = (file.name.split('.').pop() || 'webp').toLowerCase();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: upErr } = await supabase.storage.from('properties').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
        if (upErr) {
          console.error(upErr);
          toast({ title: 'Erro no upload', description: original.name, variant: 'destructive' });
          continue;
        }

        const { data: pub } = supabase.storage.from('properties').getPublicUrl(path);
        uploaded.push({
          url: pub.publicUrl,
          order: baseOrder + i,
          is_cover: photos.length === 0 && i === 0,
        });
      }

      onChange([...photos, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removePhoto = (idx: number) => {
    const next = photos.filter((_, i) => i !== idx);
    if (photos[idx]?.is_cover && next.length > 0) {
      next[0] = { ...next[0], is_cover: true };
    }
    onChange(next);
  };

  const setCover = (idx: number) => {
    const next = photos.map((p, i) => ({ ...p, is_cover: i === idx }));
    onChange(next);
  };

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (idx: number) => {
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const arr = [...photos];
    const [moved] = arr.splice(dragIdx.current, 1);
    arr.splice(idx, 0, moved);
    onChange(arr.map((p, i) => ({ ...p, order: i })));
    dragIdx.current = null;
  };

  const sorted = sortPhotos(photos);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Fotos ({photos.length}/{max})
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || photos.length >= max}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Adicionar fotos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {sorted.length === 0 ? (
        <div
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center text-muted-foreground cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Clique para adicionar fotos do imóvel</p>
          <p className="text-xs mt-1">Até {max} fotos · as imagens são otimizadas e convertidas para WebP automaticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sorted.map((p, idx) => {
            const realIdx = photos.indexOf(p);
            return (
              <div
                key={p.url}
                draggable
                onDragStart={() => handleDragStart(realIdx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(realIdx)}
                className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
              >
              <img src={p.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                {p.is_cover && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> Capa
                  </div>
                )}
                {/* Botão de lixeira sempre visível (mobile-friendly) */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhoto(realIdx); }}
                  className="absolute top-1 right-1 z-10 rounded-full bg-destructive text-destructive-foreground p-1.5 shadow-md hover:bg-destructive/90 transition-colors"
                  title="Remover foto"
                  aria-label="Remover foto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  {!p.is_cover && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => setCover(realIdx)}
                      title="Definir como capa"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => removePhoto(realIdx)}
                    title="Remover"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-1 right-1 text-white opacity-60 cursor-grab">
                  <GripVertical className="h-4 w-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sorted.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Arraste para reordenar · Clique na estrela para definir a capa
        </p>
      )}
    </div>
  );
}
