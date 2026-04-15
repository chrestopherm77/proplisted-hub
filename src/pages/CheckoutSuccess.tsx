import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const pollRef = useRef(false);

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
          const { data: purchase } = await supabase
            .from('credit_purchases')
            .select('status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (purchase?.status === 'PAID') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('credit_balance')
              .eq('id', user.id)
              .single();

            if (!cancelled) {
              setNewBalance(profile?.credit_balance ?? 0);
              setConfirmed(true);
              setPolling(false);
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

  // Countdown for redirect (non-credits or after confirmation)
  useEffect(() => {
    if (isCredits && !confirmed) return;

    const target = isCredits ? '/leads-disponiveis' : '/my-leads';
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

  const redirectTarget = isCredits ? '/leads-disponiveis' : '/my-leads';
  const redirectLabel = isCredits ? 'Ver leads disponíveis' : 'Acompanhar meu pedido';

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
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Seu pagamento foi recebido mas ainda está sendo processado.<br />
                  Os créditos serão adicionados automaticamente em breve.
                </p>
                <Button
                  onClick={() => navigate('/leads-disponiveis')}
                  size="lg"
                  className="w-full text-base font-medium"
                >
                  Ir para leads disponíveis
                </Button>
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
