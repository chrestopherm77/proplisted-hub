import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, RefreshCw, Bell, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingCreditPurchase {
  id: string;
  user_id: string;
  credits: number;
  amount: number;
  asaas_payment_id: string | null;
  status: string;
  created_at: string;
  payment_method: string | null;
  user_name?: string;
  user_email?: string;
}

interface PendingLeadPurchase {
  id: string;
  user_id: string;
  lead_id: string;
  amount: number;
  asaas_payment_id: string | null;
  status: string;
  purchased_at: string;
  payment_method: string | null;
  user_name?: string;
  user_email?: string;
  lead_name?: string;
}

interface AdminAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  payload: any;
  created_at: string;
  read_at: string | null;
}

export function PendingPaymentsManagement() {
  const { toast } = useToast();
  const [credits, setCredits] = useState<PendingCreditPurchase[]>([]);
  const [leads, setLeads] = useState<PendingLeadPurchase[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState<string | null>(null);
  const [bulkReconciling, setBulkReconciling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const [creditsRes, leadsRes, alertsRes] = await Promise.all([
      supabase
        .from('credit_purchases')
        .select('id, user_id, credits, amount, asaas_payment_id, status, created_at, payment_method')
        .eq('status', 'PENDING')
        .lt('created_at', cutoff)
        .order('created_at', { ascending: false }),
      supabase
        .from('purchases')
        .select('id, user_id, lead_id, amount, asaas_payment_id, status, purchased_at, payment_method')
        .eq('status', 'PENDING')
        .lt('purchased_at', cutoff)
        .order('purchased_at', { ascending: false }),
      supabase
        .from('admin_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const creditData = (creditsRes.data ?? []) as PendingCreditPurchase[];
    const leadData = (leadsRes.data ?? []) as PendingLeadPurchase[];

    // Enrich with user/lead info
    const userIds = Array.from(new Set([...creditData.map((c) => c.user_id), ...leadData.map((l) => l.user_id)]));
    const leadIds = Array.from(new Set(leadData.map((l) => l.lead_id)));

    const [profilesRes, leadInfoRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from('profiles').select('id, name, email').in('id', userIds)
        : Promise.resolve({ data: [] as any[] }),
      leadIds.length > 0
        ? supabase.from('leads').select('id, name').in('id', leadIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
    const leadMap = new Map((leadInfoRes.data ?? []).map((l: any) => [l.id, l]));

    setCredits(
      creditData.map((c) => ({
        ...c,
        user_name: profileMap.get(c.user_id)?.name,
        user_email: profileMap.get(c.user_id)?.email,
      })),
    );
    setLeads(
      leadData.map((l) => ({
        ...l,
        user_name: profileMap.get(l.user_id)?.name,
        user_email: profileMap.get(l.user_id)?.email,
        lead_name: leadMap.get(l.lead_id)?.name,
      })),
    );
    setAlerts((alertsRes.data ?? []) as AdminAlert[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const reconcileOne = async (id: string, type: 'credit_purchase' | 'lead_purchase') => {
    setReconciling(id);
    const { data, error } = await supabase.functions.invoke('reconcile-asaas-payments', {
      body: { purchase_id: id, type },
    });
    setReconciling(null);

    if (error || data?.error) {
      toast({ title: 'Erro', description: data?.error || 'Falha ao reconciliar', variant: 'destructive' });
      return;
    }

    const result = data?.results?.[0];
    if (result?.action === 'CONFIRMED') {
      toast({ title: 'Pagamento confirmado', description: result.message ?? 'Reconciliado com sucesso' });
    } else if (result?.action === 'EXPIRED') {
      toast({ title: 'Pagamento expirado', description: 'Marcado como expirado no Asaas' });
    } else if (result?.action === 'STILL_PENDING') {
      toast({ title: 'Ainda pendente', description: `Status no Asaas: ${result.asaas_status ?? 'desconhecido'}` });
    } else {
      toast({ title: 'Sem atualização', description: result?.message ?? 'Nenhuma ação aplicada' });
    }
    fetchData();
  };

  const reconcileAll = async () => {
    setBulkReconciling(true);
    const { data, error } = await supabase.functions.invoke('reconcile-asaas-payments', { body: {} });
    setBulkReconciling(false);

    if (error || data?.error) {
      toast({ title: 'Erro', description: data?.error || 'Falha na reconciliação', variant: 'destructive' });
      return;
    }
    const s = data?.summary;
    toast({
      title: 'Reconciliação concluída',
      description: `${s?.confirmed ?? 0} confirmadas, ${s?.expired ?? 0} expiradas, ${s?.still_pending ?? 0} pendentes, ${s?.errors ?? 0} erros`,
    });
    fetchData();
  };

  const markAlertRead = async (id: string) => {
    await supabase.from('admin_alerts').update({ read_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  };

  const severityColor = (s: string) => {
    if (s === 'CRITICAL') return 'destructive';
    if (s === 'ERROR') return 'destructive';
    if (s === 'WARNING') return 'secondary';
    return 'outline';
  };

  const fmtCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Pagamentos pendentes</h2>
          <p className="text-sm text-muted-foreground">
            Compras travadas há mais de 30 minutos sem confirmação do Asaas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={reconcileAll} disabled={bulkReconciling || (credits.length === 0 && leads.length === 0)}>
            {bulkReconciling ? 'Reconciliando...' : 'Reverificar todos no Asaas'}
          </Button>
        </div>
      </div>

      {alerts.filter((a) => !a.read_at).length > 0 && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">Alertas críticos</h3>
              {alerts.filter((a) => !a.read_at).map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 rounded border bg-background p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={severityColor(a.severity) as any}>{a.severity}</Badge>
                      <span className="text-xs text-muted-foreground">{fmtDate(a.created_at)}</span>
                    </div>
                    <p className="text-sm">{a.message}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => markAlertRead(a.id)}>
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="credits">
        <TabsList>
          <TabsTrigger value="credits">Créditos ({credits.length})</TabsTrigger>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-1" />
            Histórico de alertas ({alerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credits">
          <Card className="overflow-hidden">
            {credits.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhuma compra de créditos pendente há mais de 30 min.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Há</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="text-sm font-medium">{c.user_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{c.user_email}</div>
                      </TableCell>
                      <TableCell>{c.credits}</TableCell>
                      <TableCell>{fmtCurrency(Number(c.amount))}</TableCell>
                      <TableCell className="font-mono text-xs">{c.asaas_payment_id ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => reconcileOne(c.id, 'credit_purchase')} disabled={reconciling === c.id}>
                          {reconciling === c.id ? 'Verificando...' : 'Reverificar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card className="overflow-hidden">
            {leads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhuma compra de lead pendente há mais de 30 min.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Há</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="text-sm font-medium">{l.user_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{l.user_email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{l.lead_name ?? '—'}</TableCell>
                      <TableCell>{fmtCurrency(Number(l.amount))}</TableCell>
                      <TableCell className="font-mono text-xs">{l.asaas_payment_id ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(l.purchased_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => reconcileOne(l.id, 'lead_purchase')} disabled={reconciling === l.id}>
                          {reconciling === l.id ? 'Verificando...' : 'Reverificar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="overflow-hidden">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhum alerta registrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Quando</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell><Badge variant={severityColor(a.severity) as any}>{a.severity}</Badge></TableCell>
                      <TableCell className="text-xs font-mono">{a.type}</TableCell>
                      <TableCell className="text-sm max-w-md">{a.message}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(a.created_at)}</TableCell>
                      <TableCell>
                        {a.read_at ? (
                          <Badge variant="outline">Lido</Badge>
                        ) : (
                          <Badge variant="secondary">Não lido</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!a.read_at && (
                          <Button size="sm" variant="ghost" onClick={() => markAlertRead(a.id)}>
                            Marcar lido
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
