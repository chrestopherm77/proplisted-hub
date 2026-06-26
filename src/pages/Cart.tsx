import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ShoppingBag, Coins, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsPaidSubscriber } from '@/hooks/useIsPaidSubscriber';

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
  const [creditBalance, setCreditBalance] = useState(0);
  const [buyingAll, setBuyingAll] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isPaidSubscriber } = useIsPaidSubscriber();
  const priceMultiplier = isPaidSubscriber ? 1 : 2;
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    fetchCart();
    fetchBalance();
  }, [user, authLoading, navigate]);

  const fetchCart = async () => {
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select('id, lead_id, added_at, leads (id, name, description, price)')
        .eq('user_id', user?.id);
      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      toast({ title: 'Erro ao carregar carrinho', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('credit_balance').eq('id', user.id).single();
    if (data) setCreditBalance(data.credit_balance || 0);
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase.from('shopping_cart').delete().eq('id', cartItemId);
      if (error) throw error;
      setCartItems(cartItems.filter(item => item.id !== cartItemId));
      toast({ title: 'Item removido' });
    } catch (error) {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    }
  };

  const buyLeadWithCredits = async (leadId: string, cartItemId: string) => {
    setBuyingId(leadId);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-lead-with-credits', {
        body: { leadId },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.needed) {
          toast({ title: 'Créditos insuficientes', description: `Precisa de ${data.needed}, saldo: ${data.balance}`, variant: 'destructive' });
          navigate('/comprar-creditos');
          return;
        }
        toast({ title: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: '✅ Lead comprado!' });
      setCreditBalance(data.new_balance);
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setBuyingId(null);
    }
  };

  const buyAllWithCredits = async () => {
    const totalCredits = cartItems.reduce((sum, item) => sum + Math.round(Number(item.leads.price)) * priceMultiplier, 0);
    if (totalCredits > creditBalance) {
      toast({ title: 'Créditos insuficientes', description: `Precisa de ${totalCredits}, saldo: ${creditBalance}`, variant: 'destructive' });
      navigate('/comprar-creditos');
      return;
    }
    setBuyingAll(true);
    for (const item of cartItems) {
      await buyLeadWithCredits(item.lead_id, item.id);
    }
    setBuyingAll(false);
  };

  const calculateTotalCredits = () =>
    cartItems.reduce((total, item) => total + Math.round(Number(item.leads.price)), 0);

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
        <div className="flex items-center mb-4 md:mb-6">
          <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-primary mr-2 md:mr-3" />
          <h1 className="text-2xl md:text-3xl font-bold">Meu Carrinho</h1>
        </div>

        {/* Credit Balance */}
        <div className="mb-4 flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <span className="text-sm text-muted-foreground">Seu saldo: </span>
            <span className="font-bold text-yellow-700 dark:text-yellow-300">{creditBalance.toLocaleString('pt-BR')} créditos</span>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate('/comprar-creditos')}>
            + Créditos
          </Button>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground mb-4">Seu carrinho está vazio</p>
              <Button onClick={() => navigate('/leads')}>Explorar Leads</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => {
              const credits = Math.round(Number(item.leads.price));
              return (
                <Card key={item.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">
                      Lead #{item.leads.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={buyingId === item.lead_id}
                        onClick={() => buyLeadWithCredits(item.lead_id, item.id)}
                      >
                        {buyingId === item.lead_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4 mr-1" />}
                        Comprar
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{credits}</span>
                      <span className="text-sm text-muted-foreground">créditos</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {calculateTotalCredits().toLocaleString('pt-BR')}
                    </span>
                    <span className="text-sm text-muted-foreground">créditos</span>
                  </div>
                </div>
                <Button onClick={buyAllWithCredits} className="w-full" size="lg" disabled={buyingAll}>
                  {buyingAll ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Coins className="h-5 w-5 mr-2" />}
                  Comprar Todos com Créditos
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
