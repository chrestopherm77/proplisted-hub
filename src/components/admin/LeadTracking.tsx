import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, UserX, Clock, Monitor } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PageView {
  id: string;
  session_id: string;
  user_agent: string | null;
  referrer: string | null;
  screen_width: number | null;
  screen_height: number | null;
  language: string | null;
  created_at: string | null;
}

interface PartialLead {
  id: string;
  session_id: string;
  name: string | null;
  phone: string | null;
  intention: string | null;
  current_step: string | null;
  step_index: number | null;
  total_steps: number | null;
  completed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const intentionLabels: Record<string, string> = {
  SELL: 'Vender',
  BUY: 'Comprar',
  BUILD: 'Construir',
  RENT: 'Alugar',
};

const intentionColors: Record<string, string> = {
  SELL: 'bg-red-100 text-red-800',
  BUY: 'bg-blue-100 text-blue-800',
  BUILD: 'bg-amber-100 text-amber-800',
  RENT: 'bg-green-100 text-green-800',
};

function parseBrowser(ua: string | null): string {
  if (!ua) return 'Desconhecido';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return 'Outro';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function LeadTracking() {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [partialLeads, setPartialLeads] = useState<PartialLead[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [chartData, setChartData] = useState<{ date: string; views: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [viewsRes, partialsRes] = await Promise.all([
      supabase
        .from('lp_page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('lp_partial_leads')
        .select('*')
        .eq('completed', false)
        .order('updated_at', { ascending: false })
        .limit(100),
    ]);

    if (viewsRes.data) {
      setPageViews(viewsRes.data as PageView[]);
      setTotalViews(viewsRes.data.length);

      // Group by day for chart
      const grouped: Record<string, number> = {};
      viewsRes.data.forEach((v) => {
        const day = v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A';
        grouped[day] = (grouped[day] || 0) + 1;
      });
      const chart = Object.entries(grouped).map(([date, views]) => ({ date, views })).reverse();
      setChartData(chart);
    }

    if (partialsRes.data) {
      setPartialLeads(partialsRes.data as PartialLead[]);
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando dados de rastreamento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Últimas 100 visitas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads em Espera</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partialLeads.length}</div>
            <p className="text-xs text-muted-foreground">Não finalizaram o formulário</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Abandono</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalViews > 0 ? Math.round((partialLeads.length / totalViews) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Leads parciais / visitas</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visitas por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Leads em espera */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Leads em Espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partialLeads.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Nenhum lead parcial encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Intenção</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Última Atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partialLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name || '-'}</TableCell>
                      <TableCell>{lead.phone || '-'}</TableCell>
                      <TableCell>
                        {lead.intention ? (
                          <Badge variant="secondary" className={intentionColors[lead.intention] || ''}>
                            {intentionLabels[lead.intention] || lead.intention}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{lead.current_step || '-'}</TableCell>
                      <TableCell>
                        {lead.step_index != null && lead.total_steps ? (
                          <span className="text-xs">
                            {lead.step_index + 1}/{lead.total_steps}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(lead.updated_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent page views */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Visitas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Navegador</TableHead>
                  <TableHead>Tela</TableHead>
                  <TableHead>Referrer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageViews.slice(0, 20).map((view) => (
                  <TableRow key={view.id}>
                    <TableCell className="text-xs">{formatDate(view.created_at)}</TableCell>
                    <TableCell className="text-xs">{parseBrowser(view.user_agent)}</TableCell>
                    <TableCell className="text-xs">
                      {view.screen_width && view.screen_height ? `${view.screen_width}x${view.screen_height}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{view.referrer || 'Direto'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
