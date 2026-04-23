import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Loader2, ExternalLink, Coins, Building2, Handshake, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionLimits, type LimitResource } from '@/hooks/useSubscriptionLimits';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SubData {
  id: string;
  status: string;
  current_period_end: string | null;
  next_due_date: string | null;
  invoice_url: string | null;
  payment_method: string | null;
  plan: { name: string; price: number; monthly_credits: number; slug: string };
}

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ACTIVE: { label: 'Ativa', variant: 'default' },
  PENDING: { label: 'Aguardando pagamento', variant: 'secondary' },
  OVERDUE: { label: 'Em atraso', variant: 'destructive' },
  CANCELED: { label: 'Cancelada', variant: 'outline' },
  EXPIRED: { label: 'Expirada', variant: 'outline' },
};

export const MySubscriptionCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { plan, can, creditBalance, loading: limitsLoading } = useSubscriptionLimits();
  const [sub, setSub] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  const usageItems: Array<{ key: LimitResource; label: string; icon: typeof Building2 }> = [
    { key: 'portal_properties', label: 'Imóveis no portal', icon: Building2 },
    { key: 'partnership_requests', label: 'Solicitações de parceria', icon: Handshake },
    { key: 'partnership_offers', label: 'Ofertas de parceria (mês)', icon: Send },
    { key: 'creatives_per_month', label: 'Criativos (mês)', icon: Sparkles },
  ];

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_subscriptions')
      .select('id, status, current_period_end, next_due_date, invoice_url, payment_method, plan:subscription_plans(name, price, monthly_credits, slug)')
      .eq('user_id', user!.id)
      .in('status', ['ACTIVE', 'PENDING', 'OVERDUE'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSub(data as any);
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!sub) return;
    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: sub.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Assinatura cancelada', description: 'Você manterá o acesso até o fim do período pago.' });
      await load();
    } catch (err: any) {
      toast({ title: 'Erro ao cancelar', description: err.message, variant: 'destructive' });
    } finally {
      setCanceling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Minha Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !sub ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">Você ainda não possui um plano ativo.</p>
            <Button onClick={() => navigate('/planos')}>Ver planos disponíveis</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{sub.plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {Number(sub.plan.price) === 0
                    ? 'Grátis'
                    : `R$ ${Number(sub.plan.price).toFixed(2).replace('.', ',')}/mês`}
                  {' · '}{sub.plan.monthly_credits} créditos/mês
                </p>
              </div>
              <Badge variant={statusLabel[sub.status]?.variant ?? 'outline'}>
                {statusLabel[sub.status]?.label ?? sub.status}
              </Badge>
            </div>

            {sub.status === 'ACTIVE' && sub.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Próxima renovação: {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}
              </p>
            )}
            {sub.status === 'PENDING' && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Aguardando confirmação do pagamento.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {sub.status === 'PENDING' && sub.invoice_url && (
                <Button size="sm" asChild>
                  <a href={sub.invoice_url} target="_blank" rel="noopener noreferrer">
                    Pagar fatura <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => navigate('/planos')}>
                Trocar plano
              </Button>
              {sub.status !== 'CANCELED' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive">
                      Cancelar assinatura
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Você manterá acesso até o fim do período já pago e não será cobrado novamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel} disabled={canceling}>
                        {canceling ? 'Cancelando...' : 'Confirmar cancelamento'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
