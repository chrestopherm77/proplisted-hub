import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Lead {
  id: string;
  description: string;
  price: number;
  purchase_count: number;
  max_purchases: number;
  is_active: boolean;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchLeads();
    fetchCart();
  }, [user, authLoading]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, description, price, purchase_count, max_purchases, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Erro ao carregar leads',
        description: 'Não foi possível carregar os leads disponíveis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select('lead_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data?.map((item) => item.lead_id) || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (leadId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .insert({ user_id: user.id, lead_id: leadId });

      if (error) throw error;

      setCartItems([...cartItems, leadId]);
      toast({
        title: 'Adicionado ao carrinho!',
        description: 'Lead adicionado com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar ao carrinho',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const isInCart = (leadId: string) => cartItems.includes(leadId);
  const isSoldOut = (lead: Lead) => lead.purchase_count >= lead.max_purchases;

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Carregando leads...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Marketplace de Leads</h1>
          <p className="text-muted-foreground">
            Explore e compre leads qualificados para seu negócio imobiliário
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <Card key={lead.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Lead #{lead.id.slice(0, 8)}</CardTitle>
                  <Badge variant={isSoldOut(lead) ? 'destructive' : 'default'}>
                    {isSoldOut(lead)
                      ? 'Esgotado'
                      : `${lead.purchase_count}/${lead.max_purchases} vendidos`}
                  </Badge>
                </div>
                <CardDescription className="min-h-[60px]">{lead.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-2xl font-bold text-primary">{formatPrice(lead.price)}</div>
              </CardContent>
              <CardFooter>
                {isSoldOut(lead) ? (
                  <Button disabled className="w-full">
                    Esgotado
                  </Button>
                ) : isInCart(lead.id) ? (
                  <Button variant="outline" className="w-full" disabled>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    No Carrinho
                  </Button>
                ) : (
                  <Button onClick={() => addToCart(lead.id)} className="w-full">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Adicionar ao Carrinho
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {leads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum lead disponível no momento</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
