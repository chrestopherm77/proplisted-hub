import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, Square, Smartphone, Monitor } from 'lucide-react';

interface Style {
  slug: string;
  name: string;
  description: string | null;
}

const FORMATS = [
  { id: 'POST', label: 'Post', size: '1080 × 1080', icon: Square },
  { id: 'STORIES', label: 'Stories', size: '1080 × 1920', icon: Smartphone },
  { id: 'TRAFEGO', label: 'Tráfego', size: '1200 × 628', icon: Monitor },
];

interface Props {
  styleSlug: string | null;
  format: string | null;
  setStyleSlug: (s: string) => void;
  setFormat: (f: string) => void;
}

export function StepStyleFormat({ styleSlug, format, setStyleSlug, setFormat }: Props) {
  const [styles, setStyles] = useState<Style[]>([]);

  useEffect(() => {
    supabase.from('creative_styles').select('slug,name,description').eq('is_active', true).order('name')
      .then(({ data }) => setStyles(data || []));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-1">Estilo do criativo</h3>
        <p className="text-sm text-muted-foreground mb-4">Escolha o estilo que melhor representa o imóvel.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {styles.map((s) => {
            const active = styleSlug === s.slug;
            return (
              <Card
                key={s.slug}
                onClick={() => setStyleSlug(s.slug)}
                className={cn('cursor-pointer transition-all hover:border-primary', active && 'border-primary ring-2 ring-primary')}
              >
                <CardContent className="p-4 relative">
                  {active && <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />}
                  <h4 className="font-semibold text-sm">{s.name}</h4>
                  {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-1">Formato</h3>
        <p className="text-sm text-muted-foreground mb-4">Onde o criativo será publicado.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FORMATS.map((f) => {
            const active = format === f.id;
            const Icon = f.icon;
            return (
              <Card
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={cn('cursor-pointer transition-all hover:border-primary', active && 'border-primary ring-2 ring-primary')}
              >
                <CardContent className="p-4 flex items-center gap-3 relative">
                  {active && <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />}
                  <Icon className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h4 className="font-semibold">{f.label}</h4>
                    <p className="text-xs text-muted-foreground">{f.size}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
