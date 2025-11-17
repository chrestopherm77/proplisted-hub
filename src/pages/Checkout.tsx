import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, QrCode, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  lead_id: string;
  leads: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
}

export default function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; payload: string } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCart();
  }, [user, navigate]);

  const fetchCart = async () => {
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select(`
          id,
          lead_id,
          leads (
            id,
            name,
            description,
            price
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'Carrinho vazio',
          description: 'Adicione leads ao carrinho primeiro',
          variant: 'destructive',
        });
        navigate('/cart');
        return;
      }

      setCartItems(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        title: 'Erro ao carregar carrinho',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + Number(item.leads.price), 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          paymentMethod,
          cartItems: cartItems.map(item => ({
            lead_id: item.lead_id,
            price: item.leads.price,
          })),
        },
      });

      if (error) throw error;

      if (paymentMethod === 'PIX' && data.pixQrCode) {
        setPixData({
          qrCode: data.pixQrCode,
          payload: data.pixPayload,
        });
        toast({
          title: 'Pagamento criado!',
          description: 'Use o QR Code ou código PIX para pagar',
        });
      } else if (paymentMethod === 'CREDIT_CARD') {
        toast({
          title: 'Pagamento processado!',
          description: 'Redirecionando para seus leads...',
        });
        setTimeout(() => navigate('/my-leads'), 2000);
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload);
      toast({
        title: 'Código copiado!',
        description: 'Cole no app do seu banco',
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Finalizar Compra</h1>

        {!pixData ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.leads.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.leads.description.substring(0, 50)}...
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatPrice(item.leads.price)}
                    </p>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(calculateTotal())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as 'PIX' | 'CREDIT_CARD')}
                >
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="PIX" id="pix" />
                    <Label htmlFor="pix" className="flex items-center cursor-pointer flex-1">
                      <QrCode className="h-5 w-5 mr-2 text-primary" />
                      <div>
                        <p className="font-medium">PIX</p>
                        <p className="text-sm text-muted-foreground">
                          Pagamento instantâneo
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="CREDIT_CARD" id="card" />
                    <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 mr-2 text-primary" />
                      <div>
                        <p className="font-medium">Cartão de Crédito</p>
                        <p className="text-sm text-muted-foreground">
                          Em até 12x sem juros
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <Button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full mt-6"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar Pagamento'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Pagamento PIX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${pixData.qrCode}`}
                  alt="QR Code PIX"
                  className="w-64 h-64 border-4 border-primary rounded-lg"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Ou copie o código PIX:
                </p>
                <div className="bg-muted p-3 rounded-lg break-all text-sm font-mono mb-3">
                  {pixData.payload}
                </div>
                <Button onClick={copyPixCode} variant="outline">
                  Copiar Código PIX
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Após o pagamento, seus leads estarão disponíveis em "Meus Leads"
              </p>
              <Button
                onClick={() => navigate('/my-leads')}
                variant="outline"
                className="w-full"
              >
                Ir para Meus Leads
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
