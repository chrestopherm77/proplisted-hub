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
  PENDING: 'Na fila',
  SENT: 'Disparado',
  FAILED: 'Falhou',
  SKIPPED: 'Ignorado',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function LeadFeedbackQueuePanel() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('lead_feedback_queue')
      .select('id, lead_id, scheduled_at, status, sent_at, error, leads(name, phone)')
      .order('scheduled_at', { ascending: true })
      .limit(300);
    if (!error) setRows((data || []) as QueueRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
    const t = setInterval(fetchQueue, 60000);
    return () => clearInterval(t);
  }, []);

  const summary = useMemo(() => {
    const c = (s: string) => rows.filter((r) => r.status === s).length;
    const next = rows
      .filter((r) => r.status === 'PENDING')
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];
    return {
      pending: c('PENDING'),
      sent: c('SENT'),
      failed: c('FAILED'),
      skipped: c('SKIPPED'),
      next: next?.scheduled_at ?? null,
    };
  }, [rows]);

  return (
    <Card translate="no">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Fila de disparo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Envios programados ao longo do dia. Próximo:{' '}
            <span className="font-medium">{formatDate(summary.next)}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchQueue} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Mini label="Na fila" value={summary.pending} />
          <Mini label="Disparados" value={summary.sent} />
          <Mini label="Falhas" value={summary.failed} />
          <Mini label="Ignorados" value={summary.skipped} />
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Programado para</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Nenhum item na fila.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.leads?.name || '—'}</TableCell>
                    <TableCell>{r.leads?.phone || '—'}</TableCell>
                    <TableCell className="text-xs">{formatDate(r.scheduled_at)}</TableCell>
                    <TableCell className="text-xs">{formatDate(r.sent_at)}</TableCell>
                    <TableCell>
                      {r.status === 'SENT' ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600">Disparado</Badge>
                      ) : r.status === 'PENDING' ? (
                        <Badge className="bg-amber-500 hover:bg-amber-500">Na fila</Badge>
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
