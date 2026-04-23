import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Loader2, ExternalLink, Coins, Building2, Handshake, Send, Sparkles, AlertTriangle } from 'lucide-react';
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
  const { plan, can, creditBalance, loading: limitsLoading, refresh } = useSubscriptionLimits();
  const [activeSub, setActiveSub] = useState<SubData | null>(null);
  const [pendingSub, setPendingSub] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<string | null>(null);

  const usageItems: Array<{ key: LimitResource; label: string; icon: typeof Building2 }> = [
    { key: 'portal_properties', label: 'Imóveis no portal', icon: Building2 },
    { key: 'partnership_requests', label: 'Solicitações de parceria', icon: Handshake },
    { key: 'partnership_offers', label: 'Ofertas de parceria (mês)', icon: Send },
    { key: 'creatives_per_month', label: 'Criativos (mês)', icon: Sparkles },
  ];

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_subscriptions')
      .select('id, status, current_period_end, next_due_date, invoice_url, payment_method, plan:subscription_plans(name, price, monthly_credits, slug)')
      .eq('user_id', user.id)
      .in('status', ['ACTIVE', 'PENDING', 'OVERDUE'])
      .order('created_at', { ascending: false });

    const list = (data ?? []) as any[] as SubData[];
    setActiveSub(list.find((s) => s.status === 'ACTIVE' || s.status === 'OVERDUE') ?? null);
    setPendingSub(list.find((s) => s.status === 'PENDING') ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresca quando o usuário volta para a aba (ex.: após pagar no Asaas)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load();
        refresh?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [load, refresh]);

  const handleCancel = async (subscriptionId: string) => {
    setCanceling(subscriptionId);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Assinatura cancelada', description: 'Você manterá o acesso até o fim do período pago.' });
      await load();
      refresh?.();
    } catch (err: any) {
      toast({ title: 'Erro ao cancelar', description: err.message, variant: 'destructive' });
    } finally {
      setCanceling(null);
    }
  };

  // Plano realmente em uso (vem do hook, que faz fallback para CONEXÃO se não há ACTIVE)
  const currentPlanName = plan?.name ?? 'Conexão';
  const currentPlanPrice = plan?.price ?? 0;
  const currentPlanCredits = plan?.monthly_credits ?? 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Minha Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading || limitsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bloco 1: Plano em uso real */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Plano atual</p>
                  <p className="font-bold text-lg">{currentPlanName}</p>
                  <p className="text-sm text-muted-foreground">
                    {Number(currentPlanPrice) === 0
                      ? 'Grátis'
                      : `R$ ${Number(currentPlanPrice).toFixed(2).replace('.', ',')}/mês`}
                    {' · '}{currentPlanCredits} créditos/mês
                  </p>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>

              {activeSub?.status === 'ACTIVE' && activeSub.current_period_end && (
                <p className="text-sm text-muted-foreground">
                  Próxima renovação: {new Date(activeSub.current_period_end).toLocaleDateString('pt-BR')}
                </p>
              )}
              {activeSub?.status === 'OVERDUE' && (
                <p className="text-sm text-destructive">
                  Seu pagamento está em atraso. Regularize para manter o plano.
                </p>
              )}
            </div>

            {/* Bloco 2: Tentativa de assinatura pendente */}
            {pendingSub && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Assinatura {pendingSub.plan.name} aguardando pagamento
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                      O plano só será liberado após a confirmação do pagamento.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {pendingSub.invoice_url && (
                    <Button size="sm" asChild>
                      <a href={pendingSub.invoice_url} target="_blank" rel="noopener noreferrer">
                        Pagar fatura <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-destructive">
                        Cancelar tentativa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar tentativa de assinatura?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa fatura pendente será cancelada. Você poderá assinar novamente quando quiser.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancel(pendingSub.id)}
                          disabled={canceling === pendingSub.id}
                        >
                          {canceling === pendingSub.id ? 'Cancelando...' : 'Confirmar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            {/* Saldo de créditos */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Saldo de créditos</span>
              </div>
              <span className="text-sm font-bold">{creditBalance}</span>
            </div>

            {/* Uso do plano */}
            {plan && (
              <div className="space-y-3 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Uso do plano este mês
                </p>
                {usageItems.map(({ key, label, icon: Icon }) => {
                  const r = can(key);
                  const pct = r.isUnlimited || r.limit <= 0 ? 0 : Math.min(100, (r.used / r.limit) * 100);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </span>
                        <span className="font-medium">
                          {r.isUnlimited
                            ? 'Ilimitado'
                            : r.limit <= 0
                              ? 'Não incluso'
                              : `${r.used}/${r.limit}`}
                        </span>
                      </div>
                      {!r.isUnlimited && r.limit > 0 && (
                        <Progress value={pct} className="h-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => navigate('/planos')}>
                {activeSub ? 'Trocar plano' : 'Ver planos disponíveis'}
              </Button>
              {activeSub && (
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
                      <AlertDialogAction
                        onClick={() => handleCancel(activeSub.id)}
                        disabled={canceling === activeSub.id}
                      >
                        {canceling === activeSub.id ? 'Cancelando...' : 'Confirmar cancelamento'}
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
