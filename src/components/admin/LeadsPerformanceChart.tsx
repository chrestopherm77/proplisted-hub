import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LeadStats {
  name: string;
  vendidos: number;
  disponíveis: number;
}

export function LeadsPerformanceChart() {
  const [data, setData] = useState<LeadStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadsData();
  }, []);

  const fetchLeadsData = async () => {
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, purchase_count, max_purchases')
        .order('purchase_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      const chartData = leads?.map((lead, index) => ({
        name: `Lead ${index + 1}`,
        vendidos: lead.purchase_count || 0,
        disponíveis: (lead.max_purchases || 0) - (lead.purchase_count || 0),
      })) || [];

      setData(chartData);
    } catch (error) {
      console.error('Error fetching leads data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance dos Leads</CardTitle>
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
          <CardTitle>Performance dos Leads</CardTitle>
          <CardDescription>Top 10 leads mais vendidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum lead cadastrado ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance dos Leads</CardTitle>
        <CardDescription>Top 10 leads mais vendidos</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar 
              dataKey="vendidos" 
              fill="hsl(var(--primary))" 
              name="Vendidos"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="disponíveis" 
              fill="hsl(var(--muted))" 
              name="Disponíveis"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
