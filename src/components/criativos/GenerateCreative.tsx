import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StepImages, type ImageSlot } from './wizard/StepImages';
import { StepStyleFormat } from './wizard/StepStyleFormat';
import { StepInfo, emptyPropertyInfo, formatPropertyInfo, hasAnyInfo, type PropertyInfo } from './wizard/StepInfo';
import { StepResult } from './wizard/StepResult';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { PlanLimitDialog } from '@/components/plans/PlanLimitDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TOTAL_STEPS = 4;
const CREATIVE_COST = 10;
const initialSlots = (): ImageSlot[] =>
  Array.from({ length: 8 }, () => ({ url: null, position: 'bottom-right' as const, watermark: false, opacity: 0.35 }));

export function GenerateCreative({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { can, plan, creditBalance, refresh: refreshLimits, isAdmin } = useSubscriptionLimits();
  const creativesGate = can('creatives_per_month');
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<ImageSlot[]>(initialSlots());
  const [styleSlug, setStyleSlug] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [info, setInfo] = useState<PropertyInfo>(emptyPropertyInfo());
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creativeId, setCreativeId] = useState<string | null>(null);
  const [limitDialog, setLimitDialog] = useState<{ open: boolean; reason: string; secondary?: { label: string; path: string } }>({
    open: false,
    reason: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('user_brands').select('logo_url').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setBrandLogo(data?.logo_url || null));
  }, [user]);

  const canNext = () => {
    if (step === 1) return slots.some((s) => s.url);
    if (step === 2) return !!styleSlug && !!format;
    if (step === 3) return hasAnyInfo(info);
    return true;
  };

  const handleGenerate = async () => {
    if (!user) return;

    const willCallAi = !!slots[0]?.url;

    if (!creativesGate.allowed) {
      setLimitDialog({
        open: true,
        reason: creativesGate.reason ?? `Você atingiu o limite mensal de criativos do plano ${plan?.name ?? ''}.`,
      });
      return;
    }

    if (willCallAi && !isAdmin && creditBalance < CREATIVE_COST) {
      setLimitDialog({
        open: true,
        reason: `Cada criativo custa ${CREATIVE_COST} créditos. Seu saldo atual é ${creditBalance}.`,
        secondary: { label: 'Comprar créditos', path: '/comprar-creditos' },
      });
      return;
    }

    setSaving(true);
    const principal = slots[0];
    const mockups = slots.slice(1)
      .filter((s) => !!s.url)
      .map((s) => ({ image_url: s.url, logo_position: s.position }));

    const { data: created, error } = await supabase.from('creatives').insert({
      user_id: user.id,
      style_slug: styleSlug!,
      format: format!,
      info_text: formatPropertyInfo(info),
      main_image_url: principal?.url || null,
      mockup_images: mockups,
      status: 'PENDING',
    }).select('id').single();
    setSaving(false);
    if (error || !created) return toast({ title: 'Erro', description: error?.message || 'Falha ao criar criativo', variant: 'destructive' });

    setCreativeId(created.id);
    setStep(4);

    if (principal?.url) {
      // Trigger AI generation in background, passing logo position from main slot
      supabase.functions.invoke('generate-creative-image', {
        body: { creative_id: created.id, logo_position: principal.position || 'bottom-right' },
      })
        .then(({ error: fnErr }) => {
          if (fnErr) {
            toast({ title: 'Erro na geração com IA', description: fnErr.message, variant: 'destructive' });
          }
        });
      toast({ title: 'Criativo enviado!', description: 'A imagem principal está sendo gerada pela IA.' });
    } else {
      toast({ title: 'Criativo salvo!', description: 'Mockups prontos.' });
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Coins className="h-4 w-4" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          {isAdmin ? (
            <span>Acesso de administrador: geração de criativos liberada sem custo de créditos e sem limites.</span>
          ) : (
            <>
              <span>
                Cada criativo gerado com IA custa <strong>{CREATIVE_COST} créditos</strong>. Saldo atual:{' '}
                <strong>{creditBalance}</strong> créditos.
              </span>
              {!creativesGate.isUnlimited && creativesGate.limit > 0 && (
                <span className="text-xs text-muted-foreground">
                  Uso mensal: {creativesGate.used}/{creativesGate.limit} criativos do plano {plan?.name ?? ''}
                </span>
              )}
              {creativesGate.isUnlimited && (
                <span className="text-xs text-muted-foreground">Criativos ilimitados no plano {plan?.name ?? ''}</span>
              )}
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded ${i + 1 <= step ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Passo {step} de {TOTAL_STEPS}</p>

      <PlanLimitDialog
        open={limitDialog.open}
        onOpenChange={(open) => setLimitDialog((s) => ({ ...s, open }))}
        title="Não foi possível gerar o criativo"
        description={limitDialog.reason}
        secondaryCtaLabel={limitDialog.secondary?.label}
        secondaryCtaPath={limitDialog.secondary?.path}
      />

      <Card>
        <CardContent className="p-6">
          {step === 1 && <StepImages slots={slots} setSlots={setSlots} brandLogo={brandLogo} />}
          {step === 2 && <StepStyleFormat styleSlug={styleSlug} format={format} setStyleSlug={setStyleSlug} setFormat={setFormat} />}
          {step === 3 && <StepInfo info={info} setInfo={setInfo} />}
          {step === 4 && <StepResult slots={slots} brandLogo={brandLogo} creativeId={creativeId} />}
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
