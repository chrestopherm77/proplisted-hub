import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Crown, TrendingUp, Users } from 'lucide-react';

interface SubRow {
  id: string;
  status: string;
  user_id: string;
  current_period_end: string | null;
  created_at: string;
  plan: { name: string; price: number; slug: string };
  profile?: { name: string | null; email: string | null };
}

export const SubscriptionsManagement = () => {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: subsData } = await supabase
      .from('user_subscriptions')
      .select('id, status, user_id, current_period_end, created_at, plan:subscription_plans!user_subscriptions_plan_id_fkey(name, price, slug)')
      .order('created_at', { ascending: false });

    const userIds = Array.from(new Set((subsData ?? []).map((s: any) => s.user_id)));
    let profiles: Record<string, { name: string | null; email: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);
      profiles = Object.fromEntries((profData ?? []).map((p: any) => [p.id, { name: p.name, email: p.email }]));
    }

    setSubs(((subsData ?? []) as any[]).map((s) => ({ ...s, profile: profiles[s.user_id] })));
    setLoading(false);
  };

  const filtered = filter === 'ALL' ? subs : subs.filter((s) => s.status === filter);

  const mrr = subs
    .filter((s) => s.status === 'ACTIVE')
    .reduce((acc, s) => acc + Number(s.plan?.price ?? 0), 0);
  const activeCount = subs.filter((s) => s.status === 'ACTIVE').length;
  const pendingCount = subs.filter((s) => s.status === 'PENDING').length;

  const statusBadge = (status: string) => {
    const map: Record<string, any> = {
      ACTIVE: { label: 'Ativa', variant: 'default' },
      PENDING: { label: 'Pendente', variant: 'secondary' },
      OVERDUE: { label: 'Em atraso', variant: 'destructive' },
      CANCELED: { label: 'Cancelada', variant: 'outline' },
      EXPIRED: { label: 'Expirada', variant: 'outline' },
    };
    const cfg = map[status] ?? { label: status, variant: 'outline' };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR (Receita Mensal Recorrente)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {mrr.toFixed(2).replace('.', ',')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
          <Tabs value={filter} onValueChange={setFilter} className="mt-2">
            <TabsList>
              <TabsTrigger value="ALL">Todas</TabsTrigger>
              <TabsTrigger value="ACTIVE">Ativas</TabsTrigger>
              <TabsTrigger value="PENDING">Pendentes</TabsTrigger>
              <TabsTrigger value="OVERDUE">Em atraso</TabsTrigger>
              <TabsTrigger value="CANCELED">Canceladas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma assinatura.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próxima renovação</TableHead>
                    <TableHead>Criada em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.profile?.name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{s.profile?.email ?? ''}</div>
                      </TableCell>
                      <TableCell>{s.plan?.name ?? '—'}</TableCell>
                      <TableCell>R$ {Number(s.plan?.price ?? 0).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                      <TableCell>
                        {s.current_period_end
                          ? new Date(s.current_period_end).toLocaleDateString('pt-BR')
                          : '—'}
                      </TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
