import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface LeadPurchase {
  id: string;
  amount: number;
  status: string;
  purchased_at: string;
  payment_method: string | null;
  coupon_code: string | null;
  lead_name: string;
  lead_description: string;
  user_name: string;
}

export function LeadPurchasesOverview() {
  const [purchases, setPurchases] = useState<LeadPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
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
          leads ( name, description )
        `)
        .order('purchased_at', { ascending: false });

      if (purchasesError) throw purchasesError;

      const userIds = [...new Set(purchasesData?.map((p: any) => p.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const formatted: LeadPurchase[] = (purchasesData || []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        purchased_at: p.purchased_at,
        payment_method: p.payment_method,
        coupon_code: p.coupon_code,
        lead_name: p.leads?.name || 'Lead removido',
        lead_description: p.leads?.description || '-',
        user_name: profilesMap.get(p.user_id)?.name || 'Usuário desconhecido',
      }));

      setPurchases(formatted);
    } catch (error) {
      console.error('Error fetching lead purchases:', error);
      toast({
        title: 'Erro ao carregar compras de leads',
        description: 'Não foi possível carregar a lista',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
    const map: Record<string, { variant: any; label: string }> = {
      PAID: { variant: 'default', label: 'Pago' },
      PENDING: { variant: 'secondary', label: 'Pendente' },
      EXPIRED: { variant: 'destructive', label: 'Expirado' },
      FAILED: { variant: 'destructive', label: 'Falhou' },
    };
    const cfg = map[status] || { variant: 'secondary', label: status };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const getMethodBadge = (purchase: LeadPurchase) => {
    const method = purchase.payment_method;
    const inferred = method || (purchase.amount === 0 ? 'VOUCHER' : null);
    if (!inferred) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex flex-col gap-0.5">
        {inferred === 'CREDITS' && <Badge className="bg-amber-600 text-white hover:bg-amber-700">Créditos</Badge>}
        {inferred === 'VOUCHER' && <Badge className="bg-purple-600 text-white hover:bg-purple-700">Voucher</Badge>}
        {inferred === 'PIX' && <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">PIX</Badge>}
        {inferred === 'CREDIT_CARD' && <Badge className="bg-blue-600 text-white hover:bg-blue-700">Cartão</Badge>}
        {purchase.coupon_code && (
          <span className="text-xs text-muted-foreground">
            {inferred === 'VOUCHER' ? '' : 'Cupom: '}{purchase.coupon_code}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Carregando compras de leads...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Compra de Leads (consumo de créditos)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Data</TableHead>
                <TableHead className="whitespace-nowrap">Comprador</TableHead>
                <TableHead className="whitespace-nowrap">Lead</TableHead>
                <TableHead className="whitespace-nowrap">Créditos gastos</TableHead>
                <TableHead className="whitespace-nowrap">Forma</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium whitespace-nowrap text-sm">
                    {formatDate(p.purchased_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{p.user_name}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] md:max-w-xs">
                      <p className="font-medium text-sm truncate">{p.lead_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.lead_description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold whitespace-nowrap text-sm">{p.amount}</TableCell>
                  <TableCell className="whitespace-nowrap">{getMethodBadge(p)}</TableCell>
                  <TableCell className="whitespace-nowrap">{getStatusBadge(p.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {purchases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma compra de lead registrada
          </div>
        )}
      </CardContent>
    </Card>
  );
}
