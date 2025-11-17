import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  lead_id: string;
  added_at: string;
  leads: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
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
          added_at,
          leads (
            id,
            name,
            description,
            price
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        title: 'Erro ao carregar carrinho',
        description: 'Não foi possível carregar seus itens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      setCartItems(cartItems.filter(item => item.id !== cartItemId));
      toast({
        title: 'Item removido',
        description: 'Lead removido do carrinho',
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o item',
        variant: 'destructive',
      });
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

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione leads ao carrinho antes de finalizar',
        variant: 'destructive',
      });
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">Carregando carrinho...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <ShoppingBag className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold">Meu Carrinho</h1>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground mb-4">
                Seu carrinho está vazio
              </p>
              <Button onClick={() => navigate('/leads')}>
                Explorar Marketplace
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {item.leads.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.leads.description}
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(item.leads.price)}
                  </p>
                </CardContent>
              </Card>
            ))}

            <Card className="bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full"
                  size="lg"
                >
                  Finalizar Compra
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
