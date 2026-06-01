import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePendingValidations, PendingItem } from '@/hooks/usePendingValidations';
import { Building2, Search, Check, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ValidationPromptModal = () => {
  const { pending, confirmValid, deactivate, markShown, wasShownThisSession } = usePendingValidations();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (pending.length > 0 && !wasShownThisSession()) {
      setOpen(true);
      markShown();
    }
  }, [pending.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && pending.length === 0) setOpen(false);
  }, [pending.length, open]);

  const handle = async (item: PendingItem, action: 'valid' | 'sold' | 'invalid') => {
    setBusyId(item.id);
    try {
      if (action === 'valid') {
        await confirmValid(item);
        toast({ title: 'Confirmado', description: 'Anúncio mantido ativo.' });
      } else {
        await deactivate(item, action === 'sold' ? 'SOLD' : 'NO_LONGER_VALID');
        toast({ title: 'Desativado', description: 'O anúncio foi desativado.' });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirme seus anúncios</DialogTitle>
          <DialogDescription>
            Faz mais de 30 dias que estes anúncios não são revisados. Eles ainda estão válidos?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {pending.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex items-start gap-2 mb-3">
                {item.kind === 'property' ? (
                  <Building2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                ) : (
                  <Search className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.kind === 'property' ? 'Imóvel no portal' : 'Interesse em venda parceria'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="default"
                  disabled={busyId === item.id}
                  onClick={() => handle(item, 'valid')}
                >
                  <Check className="h-3.5 w-3.5" /> Ainda está válido
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => handle(item, 'sold')}
                >
                  Já foi vendido
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => handle(item, 'invalid')}
                >
                  <X className="h-3.5 w-3.5" /> Não é mais válido
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <Clock className="h-3.5 w-3.5" /> Revisar depois
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
