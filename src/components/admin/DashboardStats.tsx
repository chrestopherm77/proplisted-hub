import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { RevenueChart } from './RevenueChart';
import { LeadsPerformanceChart } from './LeadsPerformanceChart';
import { SalesByStatusChart } from './SalesByStatusChart';
import { UsersManagement } from './UsersManagement';

interface Stats {
  totalRevenue: number;
  totalPurchases: number;
  activeLeads: number;
  totalUsers: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalPurchases: 0,
    activeLeads: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showUsers, setShowUsers] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total Revenue
      const { data: purchases } = await supabase
        .from('purchases')
        .select('amount')
        .eq('status', 'PAID');
      
      const totalRevenue = purchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Total Purchases
      const { count: purchaseCount } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PAID');

      // Active Leads
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Total Users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalRevenue,
        totalPurchases: purchaseCount || 0,
        activeLeads: leadsCount || 0,
        totalUsers: usersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return <div className="text-center py-12">Carregando estatísticas...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-success">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Vendas confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total de Compras</CardTitle>
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-primary">{stats.totalPurchases}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Leads vendidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Leads Ativos</CardTitle>
            <Package className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-info">{stats.activeLeads}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Disponíveis para venda</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" onClick={() => setShowUsers(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Usuários</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-secondary">{stats.totalUsers}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Clique para ver detalhes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <RevenueChart />
        <SalesByStatusChart />
      </div>

      <div className="grid gap-4 md:gap-6">
        <LeadsPerformanceChart />
      </div>

      <UsersManagement open={showUsers} onOpenChange={setShowUsers} />
    </div>
  );
}
