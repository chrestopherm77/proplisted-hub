import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Subpasta dentro do bucket `landing-pages`. Ex: "logos", "media", "home". */
  folder: string;
}

/**
 * Upload de imagem para o bucket público `landing-pages`. Reutilizado pelo
 * editor de LPs com slug livre e pelo editor da Página Principal.
 */
export function ImageUploadField({ label, value, onChange, folder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('landing-pages')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    setUploading(false);
    if (error) {
      toast.error('Erro no upload: ' + error.message);
      return;
    }
    const { data } = supabase.storage.from('landing-pages').getPublicUrl(path);
    onChange(data.publicUrl);
    toast.success('Imagem enviada');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value && (
        <div className="relative inline-block">
          <img src={value} alt={label} className="h-20 max-w-[200px] object-contain rounded border" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
            aria-label="Remover"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... ou faça upload"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
