import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StepImages, type ImageSlot } from './wizard/StepImages';
import { StepStyleFormat } from './wizard/StepStyleFormat';
import { StepInfo } from './wizard/StepInfo';
import { StepResult } from './wizard/StepResult';

const TOTAL_STEPS = 4;
const initialSlots = (): ImageSlot[] =>
  Array.from({ length: 8 }, () => ({ url: null, position: 'bottom-right' as const }));

export function GenerateCreative({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<ImageSlot[]>(initialSlots());
  const [styleSlug, setStyleSlug] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [info, setInfo] = useState('');
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_brands').select('logo_url').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setBrandLogo(data?.logo_url || null));
  }, [user]);

  const canNext = () => {
    if (step === 1) return slots.some((s) => s.url);
    if (step === 2) return !!styleSlug && !!format;
    if (step === 3) return info.trim().length > 0;
    return true;
  };

  const handleGenerate = async () => {
    if (!user) return;
    setSaving(true);
    const principal = slots[0];
    const mockups = slots.slice(1)
      .filter((s) => !!s.url)
      .map((s) => ({ image_url: s.url, logo_position: s.position }));

    const { error } = await supabase.from('creatives').insert({
      user_id: user.id,
      style_slug: styleSlug!,
      format: format!,
      info_text: info,
      main_image_url: principal?.url || null,
      mockup_images: mockups,
      status: 'PENDING',
    });
    setSaving(false);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    toast({ title: 'Criativo gerado!', description: 'A imagem principal será produzida pela IA em breve.' });
    setStep(4);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded ${i + 1 <= step ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Passo {step} de {TOTAL_STEPS}</p>

      <Card>
        <CardContent className="p-6">
          {step === 1 && <StepImages slots={slots} setSlots={setSlots} brandLogo={brandLogo} />}
          {step === 2 && <StepStyleFormat styleSlug={styleSlug} format={format} setStyleSlug={setStyleSlug} setFormat={setFormat} />}
          {step === 3 && <StepInfo info={info} setInfo={setInfo} />}
          {step === 4 && <StepResult slots={slots} brandLogo={brandLogo} />}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {step > 1 && step < 4 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="h-4 w-4 mr-2" />Voltar
          </Button>
        ) : <div />}

        {step < 3 && (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Próximo<ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
        {step === 3 && (
          <Button onClick={handleGenerate} disabled={!canNext() || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Gerar criativos
          </Button>
        )}
        {step === 4 && (
          <Button onClick={onDone} className="ml-auto">Ver em "Meus Criativos"</Button>
        )}
      </div>
    </div>
  );
}
