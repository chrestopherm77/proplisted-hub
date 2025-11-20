import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/my-leads');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 shadow-lg">
          <CardContent className="pt-12 pb-10 px-6 text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 blur-xl opacity-30 bg-green-500 rounded-full"></div>
              <CheckCircle className="h-24 w-24 text-green-500 mx-auto relative animate-in zoom-in-50 duration-500" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-2xl font-bold mb-3 text-foreground">
              Pagamento confirmado
            </h1>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Seu pagamento foi confirmado com sucesso.<br />
              Agora você já pode acessar seus leads.
            </p>
            
            <Button
              onClick={() => navigate('/my-leads')}
              size="lg"
              className="w-full mb-4 text-base font-medium"
            >
              Acompanhar meu pedido
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Redirecionando em {countdown} segundo{countdown !== 1 ? 's' : ''}...
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
