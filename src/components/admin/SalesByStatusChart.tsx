import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatusData {
  name: string;
  value: number;
  color: string;
}

const STATUS_COLORS: Record<string, string> = {
  PAID: 'hsl(var(--success))',
  PENDING: 'hsl(var(--warning))',
  EXPIRED: 'hsl(var(--muted))',
  FAILED: 'hsl(var(--error))',
};

const STATUS_NAMES: Record<string, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  EXPIRED: 'Expirado',
  FAILED: 'Falhou',
};

export function SalesByStatusChart() {
  const [data, setData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatusData();
  }, []);

  const fetchStatusData = async () => {
    try {
      const { data: purchases, error } = await supabase
        .from('credit_purchases')
        .select('status');

      if (error) throw error;

      // Contar por status
      const statusCount = purchases?.reduce((acc: Record<string, number>, purchase) => {
        const status = purchase.status || 'UNKNOWN';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Converter para formato do gráfico
      const chartData = Object.entries(statusCount || {}).map(([status, count]) => ({
        name: STATUS_NAMES[status] || status,
        value: count,
        color: STATUS_COLORS[status] || 'hsl(var(--muted))',
      }));

      setData(chartData);
    } catch (error) {
      console.error('Error fetching status data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Carregando dados...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Status</CardTitle>
          <CardDescription>Distribuição de status das compras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhuma compra registrada ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas por Status</CardTitle>
        <CardDescription>Distribuição de status das compras</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
