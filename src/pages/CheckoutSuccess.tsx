import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Coins, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type CreditPurchaseSnapshot = {
  status: string | null;
  confirmed_at: string | null;
  credits: number;
  created_at: string | null;
};

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isCredits = searchParams.get('type') === 'credits';

  const [countdown, setCountdown] = useState(5);
  const [polling, setPolling] = useState(isCredits);
  const [confirmed, setConfirmed] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [pollFailed, setPollFailed] = useState(false);
  const [checkingManually, setCheckingManually] = useState(false);
  const pollRef = useRef(false);
  const checkoutStartedAtRef = useRef(new Date().toISOString());

  const confirmCreditPurchase = (balance: number) => {
    setNewBalance(balance);
    setConfirmed(true);
    setPolling(false);
    setPollFailed(false);
    setCheckingManually(false);
  };

  const fetchCreditStatus = async () => {
    if (!user) return null;

    const startedAt = checkoutStartedAtRef.current;
    const [{ data: purchases, error: purchaseError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from('credit_purchases')
        .select('status, confirmed_at, credits, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startedAt)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('profiles')
        .select('credit_balance')
        .eq('id', user.id)
        .single(),
    ]);

    if (purchaseError) throw purchaseError;
    if (profileError) throw profileError;

    const recentPurchases = (purchases ?? []) as CreditPurchaseSnapshot[];
    const paidPurchase = recentPurchases.find((purchase) => purchase.status === 'PAID' || Boolean(purchase.confirmed_at));

    return {
      paidPurchase,
      balance: profile?.credit_balance ?? 0,
      hasRecentPurchase: recentPurchases.length > 0,
    };
  };

  // Polling for credit purchases
  useEffect(() => {
    if (!isCredits || !user) return;
    if (pollRef.current) return;
    pollRef.current = true;

    let cancelled = false;

    const poll = async () => {
      for (let i = 0; i < 15; i++) {
        if (cancelled) return;

        try {
          const status = await fetchCreditStatus();

          if (status?.paidPurchase) {
            if (!cancelled) {
              confirmCreditPurchase(status.balance);
            }
            return;
          }
        } catch (e) {
          console.error('Poll error:', e);
        }

        await new Promise(r => setTimeout(r, 2000));
      }

      if (!cancelled) {
        setPolling(false);
        setPollFailed(true);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [isCredits, user]);

  // Manual check via edge function fallback
  const handleManualCheck = async () => {
    if (!user) return;
    setCheckingManually(true);

    try {
      const currentStatus = await fetchCreditStatus();
      if (currentStatus?.paidPurchase) {
        confirmCreditPurchase(currentStatus.balance);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-credit-status');

      if (error) {
        console.error('Manual check error:', error);
        setCheckingManually(false);
        return;
      }

      if (data?.status === 'PAID') {
        confirmCreditPurchase(data.balance ?? 0);
      } else {
        setCheckingManually(false);
      }
    } catch (e) {
      console.error('Manual check error:', e);
      setCheckingManually(false);
    }
  };

  // Countdown for redirect (non-credits or after confirmation)
  useEffect(() => {
    if (isCredits && !confirmed) return;

    const target = isCredits ? '/leads' : '/primeiros-passos';
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate(target);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, isCredits, confirmed]);

  const redirectTarget = isCredits ? '/leads' : '/primeiros-passos';
  const redirectLabel = isCredits ? 'Ver leads disponíveis' : 'Ir para Primeiros Passos';

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 shadow-lg">
          <CardContent className="pt-12 pb-10 px-6 text-center">
            {polling ? (
              <>
                <div className="mb-6">
                  <Loader2 className="h-20 w-20 text-primary mx-auto animate-spin" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-bold mb-3 text-foreground">
                  Processando seus créditos...
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  Aguarde enquanto confirmamos seu pagamento.<br />
                  Isso pode levar alguns segundos.
                </p>
              </>
            ) : pollFailed ? (
              <>
                <div className="mb-6">
                  <Coins className="h-20 w-20 text-yellow-500 mx-auto" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-bold mb-3 text-foreground">
                  Pagamento em processamento
                </h1>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Seu pagamento foi recebido mas ainda está sendo processado.<br />
                  Clique abaixo para verificar o status diretamente.
                </p>
                <Button
                  onClick={handleManualCheck}
                  disabled={checkingManually}
                  size="lg"
                  className="w-full mb-4 text-base font-medium"
                >
                  {checkingManually ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</>
                  ) : (
                    <><RefreshCw className="mr-2 h-4 w-4" />Verificar status do pagamento</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/leads')}
                  size="lg"
                  className="w-full text-base font-medium"
                >
                  Ir para leads disponíveis
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Os créditos serão adicionados automaticamente assim que o pagamento for confirmado.
                </p>
              </>
            ) : (
              <>
                <div className="mb-6 relative">
                  <div className="absolute inset-0 blur-xl opacity-30 bg-green-500 rounded-full"></div>
                  <CheckCircle className="h-24 w-24 text-green-500 mx-auto relative animate-in zoom-in-50 duration-500" strokeWidth={1.5} />
                </div>

                <h1 className="text-2xl font-bold mb-3 text-foreground">
                  {isCredits ? 'Créditos adicionados!' : 'Pagamento confirmado'}
                </h1>

                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {isCredits ? (
                    <>
                      Seus créditos foram adicionados com sucesso.<br />
                      Agora você pode comprar leads diretamente.
                    </>
                  ) : (
                    <>
                      Seu pagamento foi confirmado com sucesso.<br />
                      Agora você já pode acessar seus leads.
                    </>
                  )}
                </p>

                {isCredits && newBalance !== null && (
                  <div className="bg-primary/10 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground">Seu saldo atual</p>
                    <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                      <Coins className="h-7 w-7" />
                      {newBalance} créditos
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => navigate(redirectTarget)}
                  size="lg"
                  className="w-full mb-4 text-base font-medium"
                >
                  {redirectLabel}
                </Button>

                <p className="text-sm text-muted-foreground">
                  Redirecionando em {countdown} segundo{countdown !== 1 ? 's' : ''}...
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
