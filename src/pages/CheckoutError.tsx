import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function CheckoutError() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-12">
        <Card className="text-center">
          <CardContent className="pt-12 pb-12">
            <XCircle className="h-24 w-24 text-destructive mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Erro no Pagamento</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Houve um problema ao processar seu pagamento.<br />
              Por favor, tente novamente.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/cart')}
                size="lg"
                variant="outline"
              >
                Voltar ao Carrinho
              </Button>
              <Button
                onClick={() => navigate('/checkout')}
                size="lg"
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
