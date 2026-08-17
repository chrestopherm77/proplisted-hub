import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';

interface QueueRow {
  id: string;
  lead_id: string;
  scheduled_at: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED' | string;
  sent_at: string | null;
  error: string | null;
  leads?: { name: string | null; phone: string | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Aguardando disparo',
  SENT: 'Disparado',
  FAILED: 'Falhou',
  SKIPPED: 'Ignorado',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function daysUntil(d: string) {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (diff < 0) return 'atrasado';
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'amanhã';
  return `em ${diff} dias`;
}

export function LeadFeedbackQueuePanel() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [activeLeads, setActiveLeads] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    const [queueRes, totalRes, activeRes] = await Promise.all([
      (supabase as any)
        .from('lead_feedback_queue')
        .select('id, lead_id, scheduled_at, status, sent_at, error, leads(name, phone)')
        .order('scheduled_at', { ascending: true })
        .limit(300),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    if (!queueRes.error) setRows((queueRes.data || []) as QueueRow[]);
    setTotalLeads(totalRes.count || 0);
    setActiveLeads(activeRes.count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
    const t = setInterval(fetchQueue, 60000);
    return () => clearInterval(t);
  }, []);

  const pending = useMemo(
    () =>
      rows
        .filter((r) => r.status === 'PENDING')
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [rows],
  );

  const history = useMemo(
    () =>
      rows
        .filter((r) => r.status !== 'PENDING')
        .sort((a, b) => (b.sent_at || b.scheduled_at).localeCompare(a.sent_at || a.scheduled_at))
        .slice(0, 50),
    [rows],
  );

  const summary = useMemo(() => {
    const c = (s: string) => rows.filter((r) => r.status === s).length;
    return {
      pending: pending.length,
      sent: c('SENT'),
      failed: c('FAILED'),
      next: pending[0]?.scheduled_at ?? null,
    };
  }, [rows, pending]);

  return (
    <Card translate="no">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Fila de disparo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Após cada disparo o lead entra automaticamente na lista de espera com o próximo envio em 14 dias.
            Próximo disparo: <span className="font-medium">{formatDate(summary.next)}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchQueue} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Mini label="Total de leads" value={totalLeads} />
          <Mini label="Leads ativos" value={activeLeads} />
          <Mini label="Na lista de espera" value={summary.pending} />
          <Mini label="Disparados" value={summary.sent} />
          <Mini label="Falhas" value={summary.failed} />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Lista de espera — próximos disparos</h3>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Próximo disparo</TableHead>
                  <TableHead>Quando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Nenhum lead aguardando disparo.
                    </TableCell>
                  </TableRow>
                ) : (
                  pending.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.leads?.name || '—'}</TableCell>
                      <TableCell>{r.leads?.phone || '—'}</TableCell>
                      <TableCell className="text-xs">{formatDate(r.scheduled_at)}</TableCell>
                      <TableCell>
                        <Badge className="bg-amber-500 hover:bg-amber-500">{daysUntil(r.scheduled_at)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Histórico de disparos</h3>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Nenhum disparo registrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.leads?.name || '—'}</TableCell>
                      <TableCell>{r.leads?.phone || '—'}</TableCell>
                      <TableCell className="text-xs">{formatDate(r.sent_at)}</TableCell>
                      <TableCell>
                        {r.status === 'SENT' ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Disparado</Badge>
                        ) : r.status === 'FAILED' ? (
                          <Badge variant="destructive">Falhou</Badge>
                        ) : (
                          <Badge variant="outline">{STATUS_LABEL[r.status] || r.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                        {r.error || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
