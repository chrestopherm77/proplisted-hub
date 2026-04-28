import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, X, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LogoPositionPicker, type LogoPosition } from '../LogoPositionPicker';

export interface ImageSlot {
  url: string | null;
  position: LogoPosition;
  watermark: boolean;
  opacity: number;
}

interface Props {
  slots: ImageSlot[];
  setSlots: (s: ImageSlot[]) => void;
  brandLogo?: string | null;
}

export function StepImages({ slots, setSlots, brandLogo }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleUpload = async (idx: number, file: File) => {
    if (!user) return;
    setUploadingIdx(idx);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/upload-${Date.now()}-${idx}.${ext}`;
      const { error } = await supabase.storage.from('creatives').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('creatives').getPublicUrl(path);
      const next = [...slots];
      next[idx] = { ...next[idx], url: publicUrl };
      setSlots(next);
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingIdx(null);
    }
  };

  const removeSlot = (idx: number) => {
    const next = [...slots];
    next[idx] = { ...next[idx], url: null };
    setSlots(next);
  };

  const setPosition = (idx: number, pos: LogoPosition) => {
    const next = [...slots];
    next[idx] = { ...next[idx], position: pos };
    setSlots(next);
  };

  const setWatermark = (idx: number, v: boolean) => {
    const next = [...slots];
    next[idx] = { ...next[idx], watermark: v };
    setSlots(next);
  };

  const setOpacity = (idx: number, v: number) => {
    const next = [...slots];
    next[idx] = { ...next[idx], opacity: v };
    setSlots(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Imagens do criativo</h3>
        <p className="text-sm text-muted-foreground">
          Envie 1 imagem <strong>principal</strong> (será gerada pela IA) e 7 secundárias (mockups com sua logo).
        </p>
        {!brandLogo && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Você ainda não cadastrou sua logo em "Minha Marca". Os mockups ficarão sem logo.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {slots.map((slot, idx) => {
          const isPrincipal = idx === 0;
          return (
            <Card key={idx} className="overflow-hidden relative">
              {isPrincipal && (
                <Badge className="absolute top-2 left-2 z-10 gap-1">
                  <Star className="h-3 w-3" />Principal
                </Badge>
              )}
              {slot.url ? (
                <div className="relative">
                  {isPrincipal ? (
                    <div className="aspect-square w-full overflow-hidden bg-muted">
                      <img src={slot.url} alt="Principal" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <LogoPositionPicker
                      imageUrl={slot.url}
                      logoUrl={brandLogo}
                      position={slot.position}
                      onChange={(p) => setPosition(idx, p)}
                      watermark={slot.watermark}
                      opacity={slot.opacity}
                      onToggleWatermark={(v) => setWatermark(idx, v)}
                      onOpacityChange={(v) => setOpacity(idx, v)}
                    />
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => removeSlot(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputs.current[idx]?.click()}
                  disabled={uploadingIdx === idx}
                  className="aspect-square w-full bg-muted hover:bg-muted/70 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
                >
                  {uploadingIdx === idx ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      <span className="text-xs">{isPrincipal ? 'Imagem principal' : `Imagem ${idx + 1}`}</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={(el) => (inputs.current[idx] = el)}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleUpload(idx, e.target.files[0])}
              />
              {!isPrincipal && slot.url && (
                <div className="p-2 text-xs text-center text-muted-foreground">
                  Clique nos cantos ou no centro. Ative "Marca d'água" para deixar translúcida.
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
