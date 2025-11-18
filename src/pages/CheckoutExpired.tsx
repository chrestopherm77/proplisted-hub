import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export default function CheckoutExpired() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12">
        <Card className="text-center">
          <CardContent className="pt-12 pb-12">
            <Clock className="h-24 w-24 text-orange-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Checkout Expirado</h1>
            <p className="text-lg text-muted-foreground mb-8">
              O tempo para completar seu pagamento expirou.<br />
              Inicie um novo checkout para continuar.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/leads')}
                size="lg"
                variant="outline"
              >
                Ver Marketplace
              </Button>
              <Button
                onClick={() => navigate('/cart')}
                size="lg"
              >
                Ver Carrinho
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
