import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const SNOOZE_KEY = 'stale_properties_reminder_snooze';
const SNOOZE_HOURS = 24;
const LONG_SNOOZE_KEY = 'stale_properties_reminder_long_snooze';
const LONG_SNOOZE_DAYS = 30;

export const StalePropertiesReminder = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const longSnoozedAt = localStorage.getItem(`${LONG_SNOOZE_KEY}_${user.id}`);
    if (longSnoozedAt) {
      const elapsedMs = Date.now() - parseInt(longSnoozedAt, 10);
      if (elapsedMs < LONG_SNOOZE_DAYS * 24 * 60 * 60 * 1000) return;
    }

    const snoozedAt = localStorage.getItem(`${SNOOZE_KEY}_${user.id}`);
    if (snoozedAt) {
      const elapsedMs = Date.now() - parseInt(snoozedAt, 10);
      if (elapsedMs < SNOOZE_HOURS * 60 * 60 * 1000) return;
    }

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('created_at', cutoff)
      .then(({ count: c, error }) => {
        if (error) return;
        if ((c || 0) > 0) {
          setCount(c || 0);
          setOpen(true);
        }
      });
  }, [user]);

  const handleClose = (snooze: boolean) => {
    if (user && snooze) {
      localStorage.setItem(`${SNOOZE_KEY}_${user.id}`, String(Date.now()));
    }
    setOpen(false);
  };

  const handleLongSnooze = () => {
    if (user) {
      localStorage.setItem(`${LONG_SNOOZE_KEY}_${user.id}`, String(Date.now()));
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose(true)}>
      <DialogContent translate="no">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>Verifique seus imóveis publicados</DialogTitle>
          </div>
          <DialogDescription className="text-base text-foreground/80 pt-2">
            Você tem <strong>{count} {count === 1 ? 'imóvel publicado' : 'imóveis publicados'}</strong> há
            mais de 30 dias no portal. Confira se {count === 1 ? 'ele ainda está disponível' : 'eles ainda estão disponíveis'} e remova {count === 1 ? 'o anúncio' : 'os anúncios'} que já {count === 1 ? 'foi vendido ou alugado' : 'foram vendidos ou alugados'}.
            <br /><br />
            Manter o portal atualizado garante mais credibilidade e melhores resultados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
          <Button variant="ghost" size="sm" onClick={handleLongSnooze} className="text-muted-foreground">
            Não mostrar por 30 dias
          </Button>
          <Button variant="outline" onClick={() => handleClose(true)}>
            Lembrar depois
          </Button>
          <Button asChild onClick={() => handleClose(true)}>
            <Link to="/portal-imoveis">Verificar agora</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
