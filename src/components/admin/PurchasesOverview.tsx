import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface CreditPurchase {
  id: string;
  amount: number;
  credits: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  payment_method: string | null;
  package_name: string;
  user_name: string;
}

export function PurchasesOverview() {
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('credit_purchases')
        .select(`
          id,
          amount,
          credits,
          status,
          created_at,
          confirmed_at,
          payment_method,
          user_id,
          package_id,
          credit_packages ( name )
        `)
        .order('created_at', { ascending: false });

      if (purchasesError) throw purchasesError;

      const userIds = [...new Set(purchasesData?.map(p => p.user_id) || [])];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const formattedData: CreditPurchase[] = (purchasesData || []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        credits: p.credits,
        status: p.status,
        created_at: p.created_at,
        confirmed_at: p.confirmed_at,
        payment_method: p.payment_method,
        package_name: p.credit_packages?.name || 'Pacote removido',
        user_name: profilesMap.get(p.user_id)?.name || 'Usuário desconhecido',
      }));

      setPurchases(formattedData);
    } catch (error) {
      console.error('Error fetching credit purchases:', error);
      toast({
        title: 'Erro ao carregar compras',
        description: 'Não foi possível carregar as compras de créditos',
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

  const getPaymentBadge = (method: string | null) => {
    if (!method) return <span className="text-muted-foreground">—</span>;
    if (method === 'PIX') return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">PIX</Badge>;
    if (method === 'CREDIT_CARD') return <Badge className="bg-blue-600 text-white hover:bg-blue-700">Cartão</Badge>;
    if (method === 'BOLETO') return <Badge className="bg-orange-600 text-white hover:bg-orange-700">Boleto</Badge>;
    return <Badge variant="secondary">{method}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-12">Carregando compras...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Compras de Créditos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Data</TableHead>
                <TableHead className="whitespace-nowrap">Cliente</TableHead>
                <TableHead className="whitespace-nowrap">Pacote</TableHead>
                <TableHead className="whitespace-nowrap">Créditos</TableHead>
                <TableHead className="whitespace-nowrap">Valor</TableHead>
                <TableHead className="whitespace-nowrap">Forma</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium whitespace-nowrap text-sm">
                    {formatDate(purchase.confirmed_at || purchase.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{purchase.user_name}</TableCell>
                  <TableCell className="text-sm">{purchase.package_name}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-medium">{purchase.credits}</TableCell>
                  <TableCell className="font-semibold whitespace-nowrap text-sm">{formatPrice(purchase.amount)}</TableCell>
                  <TableCell className="whitespace-nowrap">{getPaymentBadge(purchase.payment_method)}</TableCell>
                  <TableCell className="whitespace-nowrap">{getStatusBadge(purchase.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {purchases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma compra de créditos realizada ainda
          </div>
        )}
      </CardContent>
    </Card>
  );
}
