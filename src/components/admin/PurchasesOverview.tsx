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
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          amount,
          status,
          purchased_at,
          leads (
            name,
            description
          ),
          profiles!purchases_user_id_fkey (
            name
          )
        `)
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((purchase: any) => ({
        id: purchase.id,
        amount: purchase.amount,
        status: purchase.status,
        purchased_at: purchase.purchased_at,
        lead: purchase.leads,
        user: {
          name: purchase.profiles?.name || 'Usuário desconhecido',
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
        <CardTitle>Histórico de Compras</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-medium">
                  {formatDate(purchase.purchased_at)}
                </TableCell>
                <TableCell>{purchase.user.name}</TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="font-medium">{purchase.lead?.name || 'Lead removido'}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {purchase.lead?.description || '-'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">{formatPrice(purchase.amount)}</TableCell>
                <TableCell>{getStatusBadge(purchase.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {purchases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma compra realizada ainda
          </div>
        )}
      </CardContent>
    </Card>
  );
}
