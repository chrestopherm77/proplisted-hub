import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function CheckoutError() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 shadow-lg">
          <CardContent className="pt-12 pb-10 px-6 text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 blur-xl opacity-30 bg-destructive rounded-full"></div>
              <XCircle className="h-24 w-24 text-destructive mx-auto relative animate-in zoom-in-50 duration-500" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-2xl font-bold mb-3 text-foreground">
              Erro no pagamento
            </h1>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Houve um problema ao processar seu pagamento.<br />
              Por favor, tente novamente.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/checkout')}
                size="lg"
                className="w-full"
              >
                Tentar Novamente
              </Button>
              <Button
                onClick={() => navigate('/cart')}
                size="lg"
                variant="outline"
                className="w-full"
              >
                Voltar ao Carrinho
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
