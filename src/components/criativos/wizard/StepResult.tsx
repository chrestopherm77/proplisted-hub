import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { MockupPreview } from '../MockupPreview';
import type { ImageSlot } from './StepImages';

interface Props {
  slots: ImageSlot[];
  brandLogo?: string | null;
}

export function StepResult({ slots, brandLogo }: Props) {
  const principal = slots[0];
  const mockups = slots.slice(1).filter((s) => !!s.url);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Seus criativos</h3>
        <p className="text-sm text-muted-foreground">A imagem principal será gerada pela IA em breve. Os mockups estão prontos.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="col-span-2 md:col-span-3 lg:col-span-2 overflow-hidden">
          <Badge className="m-2 gap-1"><Sparkles className="h-3 w-3" />Principal (IA)</Badge>
          {principal?.url ? (
            <div className="aspect-square w-full bg-muted relative">
              <img src={principal.url} alt="Principal" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                <p className="text-sm font-medium bg-background/90 px-3 py-2 rounded">
                  Será gerada pela IA — em breve
                </p>
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground text-sm">
              Sem imagem principal
            </div>
          )}
        </Card>

        {mockups.map((m, i) => (
          <Card key={i} className="overflow-hidden">
            <MockupPreview
              imageUrl={m.url!}
              logoUrl={brandLogo}
              position={m.position}
              className="w-full h-auto block"
            />
            <CardContent className="p-2">
              <p className="text-xs text-muted-foreground">Mockup {i + 1}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
