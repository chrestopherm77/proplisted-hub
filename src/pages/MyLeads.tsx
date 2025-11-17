import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface PurchasedLead {
  id: string;
  amount: number;
  purchased_at: string;
  lead: {
    name: string;
    phone: string;
    description: string;
  };
}

export default function MyLeads() {
  const [purchases, setPurchases] = useState<PurchasedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchPurchases();
  }, [user, authLoading]);

  const fetchPurchases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          amount,
          purchased_at,
          leads (
            name,
            phone,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'PAID')
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((purchase: any) => ({
        id: purchase.id,
        amount: purchase.amount,
        purchased_at: purchase.purchased_at,
        lead: purchase.leads,
      })) || [];

      setPurchases(formattedData);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: 'Erro ao carregar leads',
        description: 'Não foi possível carregar seus leads comprados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Carregando seus leads...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meus Leads</h1>
          <p className="text-muted-foreground">
            Leads que você comprou com informações completas de contato
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-1">{purchase.lead.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {purchase.lead.phone}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-success-light text-success">
                    Pago
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Descrição:</p>
                  <p className="text-sm">{purchase.lead.description}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(purchase.purchased_at)}
                  </div>
                  <div className="flex items-center text-sm font-semibold text-primary">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {formatPrice(purchase.amount)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {purchases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Você ainda não comprou nenhum lead</p>
            <a href="/leads" className="text-primary hover:underline">
              Explorar Marketplace
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
}
