import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PlanCard, type PlanCardData } from '@/components/plans/PlanCard';
import { SubscribeDialog } from '@/components/plans/SubscribeDialog';

export default function Planos() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanCardData[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activePlanPrice, setActivePlanPrice] = useState<number>(0);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [pendingInvoiceUrl, setPendingInvoiceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const [dialogPlan, setDialogPlan] = useState<PlanCardData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) loadData();
  }, [user, authLoading, navigate]);

  // Refresca quando usuário volta para a aba (ex.: após pagar no Asaas)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user) {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: plansData }, { data: subsData }] = await Promise.all([
        supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('user_subscriptions')
          .select('plan_id, status, invoice_url, created_at, plan:subscription_plans(price)')
          .eq('user_id', user!.id)
          .in('status', ['ACTIVE', 'PENDING', 'OVERDUE'])
          .order('created_at', { ascending: false }),
      ]);
      setPlans((plansData ?? []) as any);

      const subs = (subsData ?? []) as any[];
      const active = subs.find((s) => s.status === 'ACTIVE' || s.status === 'OVERDUE');
      const pending = subs.find((s) => s.status === 'PENDING');
      setActivePlanId(active?.plan_id ?? null);
      setActivePlanPrice(active ? Number(active.plan?.price ?? 0) : 0);
      setPendingPlanId(pending?.plan_id ?? null);
      setPendingInvoiceUrl(pending?.invoice_url ?? null);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar planos', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (plan: PlanCardData) => {
    if (Number(plan.price) === 0) {
      // Ativa direto
      setSubmittingPlanId(plan.id);
      try {
        const { data, error } = await supabase.functions.invoke('create-subscription', {
          body: { planId: plan.id },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast({ title: 'Plano ativado!', description: `${plan.monthly_credits} créditos foram adicionados.` });
        await loadData();
      } catch (err: any) {
        const msg = String(err?.message ?? '');
        const isAlreadyOnPlan = /j[áa]\s+est[áa]\s+no\s+plano/i.test(msg) || /already\s+(on|in)\s+plan/i.test(msg);
        if (isAlreadyOnPlan) {
          toast({ title: 'Plano já ativo', description: msg });
          await loadData();
        } else {
          toast({ title: 'Erro', description: msg, variant: 'destructive' });
        }
      } finally {
        setSubmittingPlanId(null);
      }
    } else {
      setDialogPlan(plan);
      setDialogOpen(true);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Calcula motivo de bloqueio para cada plano
  const activeIsPaid = activePlanPrice > 0;
  const hasPendingPaid = !!pendingPlanId && pendingInvoiceUrl !== null;

  const getDisabledReason = (p: PlanCardData): string | null => {
    if (activePlanId === p.id) return null; // o "Plano Atual" cuida disso
    const isFree = Number(p.price) === 0;

    // Se o usuário está em plano grátis e clica em outro grátis: bloqueia
    if (isFree && !activeIsPaid && activePlanId && activePlanId !== p.id) {
      return 'Você já está em um plano grátis. Aguarde o término do ciclo para trocar.';
    }
    // Se há PENDING pago, bloqueia ativação de qualquer grátis
    if (isFree && hasPendingPaid) {
      return 'Conclua ou cancele a assinatura pendente antes de ativar um plano grátis.';
    }
    // Se há PENDING para outro plano pago, bloqueia este pago também
    if (!isFree && hasPendingPaid && pendingPlanId !== p.id) {
      return 'Você tem uma assinatura pendente. Conclua ou cancele para escolher outro plano.';
    }
    return null;
  };

  const isDowngradePlan = (p: PlanCardData): boolean => {
    if (!activeIsPaid) return false;
    if (activePlanId === p.id) return false;
    if (Number(p.price) === 0) return true;
    return Number(p.price) < activePlanPrice;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Escolha seu plano</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Mais créditos, mais funcionalidades, mais resultado. Cancele quando quiser.
          </p>
          {activeIsPaid && (
            <p className="text-xs text-muted-foreground mt-3 max-w-xl mx-auto">
              Você está em um plano pago. Trocas de plano são <strong>agendadas</strong> para a próxima cobrança — você
              não será cobrado duas vezes nem perderá os créditos atuais.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={activePlanId === plan.id}
              isPopular={plan.slug === 'performance'}
              loading={submittingPlanId === plan.id}
              pendingInvoiceUrl={pendingPlanId === plan.id ? pendingInvoiceUrl : null}
              disabledReason={getDisabledReason(plan)}
              isDowngrade={isDowngradePlan(plan)}
              onSelect={handleSelect}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Cobrança mensal recorrente via Asaas. Os créditos são renovados a cada pagamento confirmado.
        </p>
      </div>

      <SubscribeDialog
        plan={dialogPlan}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadData}
      />
    </Layout>
  );
}
