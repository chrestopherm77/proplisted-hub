import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/my-leads');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12">
        <Card className="text-center">
          <CardContent className="pt-12 pb-12">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Pagamento Confirmado!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Seu pagamento foi processado com sucesso.<br />
              Você já pode acessar seus leads.
            </p>
            <Button
              onClick={() => navigate('/my-leads')}
              size="lg"
              className="w-full max-w-md"
            >
              Ver Meus Leads
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Redirecionando automaticamente em 5 segundos...
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
