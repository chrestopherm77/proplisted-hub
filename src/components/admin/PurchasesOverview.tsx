import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Purchase {
  id: string;
  amount: number;
  status: string;
  purchased_at: string;
  payment_method: string | null;
  coupon_code: string | null;
  lead: {
    name: string;
    description: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export function PurchasesOverview() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      // First fetch purchases with leads
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          id,
          amount,
          status,
          purchased_at,
          user_id,
          payment_method,
          coupon_code,
          leads (
            name,
            description
          )
        `)
        .order('purchased_at', { ascending: false });

      if (purchasesError) throw purchasesError;

      // Get unique user_ids and fetch profiles
      const userIds = [...new Set(purchasesData?.map(p => p.user_id) || [])];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const formattedData = purchasesData?.map((purchase: any) => ({
        id: purchase.id,
        amount: purchase.amount,
        status: purchase.status,
        purchased_at: purchase.purchased_at,
        lead: purchase.leads,
        user: {
          name: profilesMap.get(purchase.user_id)?.name || 'Usuário desconhecido',
          email: '',
        },
      })) || [];

      setPurchases(formattedData);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: 'Erro ao carregar compras',
        description: 'Não foi possível carregar as compras',
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      PAID: { variant: 'default', label: 'Pago' },
      PENDING: { variant: 'secondary', label: 'Pendente' },
      EXPIRED: { variant: 'destructive', label: 'Expirado' },
      FAILED: { variant: 'destructive', label: 'Falhou' },
    };

    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-12">Carregando compras...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Histórico de Compras</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Data</TableHead>
                <TableHead className="whitespace-nowrap">Cliente</TableHead>
                <TableHead className="whitespace-nowrap">Lead</TableHead>
                <TableHead className="whitespace-nowrap">Valor</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium whitespace-nowrap text-sm">
                    {formatDate(purchase.purchased_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{purchase.user.name}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] md:max-w-xs">
                      <p className="font-medium text-sm truncate">{purchase.lead?.name || 'Lead removido'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {purchase.lead?.description || '-'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold whitespace-nowrap text-sm">{formatPrice(purchase.amount)}</TableCell>
                  <TableCell className="whitespace-nowrap">{getStatusBadge(purchase.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {purchases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma compra realizada ainda
          </div>
        )}
      </CardContent>
    </Card>
  );
}
