import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export default function CheckoutExpired() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 shadow-lg">
          <CardContent className="pt-12 pb-10 px-6 text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 blur-xl opacity-30 bg-orange-500 rounded-full"></div>
              <Clock className="h-24 w-24 text-orange-500 mx-auto relative animate-in zoom-in-50 duration-500" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-2xl font-bold mb-3 text-foreground">
              Checkout expirado
            </h1>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              O tempo para completar seu pagamento expirou.<br />
              Inicie um novo checkout para continuar.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/cart')}
                size="lg"
                className="w-full"
              >
                Ver Carrinho
              </Button>
              <Button
                onClick={() => navigate('/leads')}
                size="lg"
                variant="outline"
                className="w-full"
              >
                Ver Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
