import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MockupPreview } from '../MockupPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ImageSlot } from './StepImages';

interface Props {
  slots: ImageSlot[];
  brandLogo?: string | null;
  creativeId?: string | null;
}

export function StepResult({ slots, brandLogo, creativeId }: Props) {
  const principal = slots[0];
  const mockups = slots.slice(1).filter((s) => !!s.url);
  const { toast } = useToast();

  const [aiUrl, setAiUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'PENDING' | 'READY' | 'FAILED' | null>(
    principal?.url ? 'PENDING' : null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Polling + realtime for status
  useEffect(() => {
    if (!creativeId || !principal?.url) return;

    let cancelled = false;
    let attempts = 0;
    const MAX = 30; // 30 * 3s = 90s

    const tick = async () => {
      if (cancelled) return;
      attempts++;
      const { data } = await supabase
        .from('creatives')
        .select('status, main_image_url, error_message')
        .eq('id', creativeId)
        .maybeSingle();
      if (!data || cancelled) return;
      if (data.status === 'READY') {
        setStatus('READY');
        setAiUrl(data.main_image_url);
        return;
      }
      if (data.status === 'FAILED') {
        setStatus('FAILED');
        setErrorMsg(data.error_message || 'Falha ao gerar');
        return;
      }
      if (attempts < MAX) setTimeout(tick, 3000);
      else {
        setStatus('FAILED');
        setErrorMsg('Tempo de geração excedido');
      }
    };
    tick();

    const channel = supabase
      .channel(`creative-${creativeId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'creatives', filter: `id=eq.${creativeId}`,
      }, (payload) => {
        const row = payload.new as any;
        if (row.status === 'READY') { setStatus('READY'); setAiUrl(row.main_image_url); }
        else if (row.status === 'FAILED') { setStatus('FAILED'); setErrorMsg(row.error_message || 'Falha ao gerar'); }
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [creativeId, principal?.url]);

  const handleRetry = async () => {
    if (!creativeId) return;
    setRetrying(true);
    setStatus('PENDING');
    setErrorMsg(null);
    const { error } = await supabase.functions.invoke('generate-creative-image', { body: { creative_id: creativeId } });
    setRetrying(false);
    if (error) {
      setStatus('FAILED');
      setErrorMsg(error.message);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Seus criativos</h3>
        <p className="text-sm text-muted-foreground">A imagem principal está sendo gerada pela IA. Os mockups estão prontos.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="col-span-2 md:col-span-3 lg:col-span-2 overflow-hidden">
          <Badge className="m-2 gap-1"><Sparkles className="h-3 w-3" />Principal (IA)</Badge>
          {!principal?.url ? (
            <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground text-sm">
              Sem imagem principal
            </div>
          ) : status === 'READY' && aiUrl ? (
            <img src={aiUrl} alt="Principal IA" className="w-full h-auto block" />
          ) : status === 'FAILED' ? (
            <div className="aspect-square bg-muted flex flex-col items-center justify-center gap-3 p-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium text-destructive">{errorMsg || 'Falha ao gerar'}</p>
              <Button size="sm" variant="outline" onClick={handleRetry} disabled={retrying}>
                {retrying ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="aspect-square w-full bg-muted relative">
              <Skeleton className="absolute inset-0" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium">Gerando com IA…</p>
                <p className="text-xs text-muted-foreground">Pode levar até 60 segundos</p>
              </div>
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
