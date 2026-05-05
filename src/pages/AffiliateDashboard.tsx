import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Copy, Users, CreditCard, TrendingUp, Wallet } from 'lucide-react';

interface Dashboard {
  is_affiliate: boolean;
  affiliate?: { id: string; name: string; email: string; code: string; commission_percent: number };
  total_referrals?: number;
  paying_referrals?: number;
  month_total?: number;
  all_total?: number;
  pending_total?: number;
  paid_total?: number;
  by_month?: { month: string; total: number }[];
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtMonth = (m: string) => {
  const d = new Date(m + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export default function AffiliateDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    (async () => {
      const { data: dash, error } = await supabase.rpc('get_affiliate_dashboard', { p_user_id: user.id });
      if (error) { toast.error('Erro ao carregar painel'); setLoading(false); return; }
      setData(dash as any);
      if ((dash as any)?.is_affiliate) {
        const { data: comms } = await supabase
          .from('affiliate_commissions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        setCommissions(comms || []);
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  if (loading || authLoading) {
    return <Layout><div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>;
  }

  if (!data?.is_affiliate) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6 text-center">
          <Card><CardContent className="p-12">
            <h1 className="text-2xl font-bold mb-2">Painel do Afiliado</h1>
            <p className="text-muted-foreground">Você ainda não foi cadastrado como afiliado. Entre em contato com o suporte para participar do programa.</p>
          </CardContent></Card>
        </div>
      </Layout>
    );
  }

  const aff = data.affiliate!;
  const link = `${window.location.origin}/?aff=${aff.code}`;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Painel do Afiliado</h1>
          <p className="text-muted-foreground text-sm">Olá, {aff.name}! Comissão: {aff.commission_percent}% sobre cada pagamento.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Seu link de divulgação</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input readOnly value={link} className="font-mono text-sm" />
              <Button onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copiado!'); }}>
                <Copy className="h-4 w-4 mr-2" /> Copiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Cadastros" value={String(data.total_referrals ?? 0)} />
          <StatCard icon={<CreditCard className="h-5 w-5" />} label="Assinantes pagos" value={String(data.paying_referrals ?? 0)} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Comissão do mês" value={fmt(data.month_total ?? 0)} highlight />
          <StatCard icon={<Wallet className="h-5 w-5" />} label="Comissão total" value={fmt(data.all_total ?? 0)} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Resumo financeiro</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">A receber</span><span className="font-semibold">{fmt(data.pending_total ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Já pago</span><span className="font-semibold">{fmt(data.paid_total ?? 0)}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Comissões por mês</CardTitle></CardHeader>
            <CardContent>
              {(data.by_month ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem comissões ainda.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.by_month!.map((m) => (
                    <li key={m.month} className="flex justify-between">
                      <span className="capitalize">{fmtMonth(m.month)}</span>
                      <span className="font-semibold">{fmt(m.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Histórico de comissões</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor pago</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sem comissões ainda</TableCell></TableRow>
                ) : commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{c.plan_name || c.plan_slug || '—'}</TableCell>
                    <TableCell>{fmt(Number(c.gross_amount))}</TableCell>
                    <TableCell>{c.commission_percent}%</TableCell>
                    <TableCell className="font-semibold">{fmt(Number(c.commission_amount))}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'PAID' ? 'default' : 'secondary'}>
                        {c.status === 'PAID' ? 'Pago' : c.status === 'CANCELED' ? 'Cancelado' : 'A receber'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-primary' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}<span>{label}</span></div>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
