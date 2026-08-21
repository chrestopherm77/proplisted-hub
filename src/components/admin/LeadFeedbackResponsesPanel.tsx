import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';

interface ResponseRow {
  id: string;
  name: string | null;
  phone: string | null;
  feedback_response: string | null;
  feedback_responded_at: string | null;
  feedback_sent_at: string | null;
  is_active: boolean;
}

interface InEvent {
  id: string;
  name: string | null;
  phone: string;
  status: string | null;
  ok: boolean;
  detail: string | null;
  created_at: string;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function LeadFeedbackResponsesPanel() {
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [events, setEvents] = useState<InEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: leads }, { data: evs }] = await Promise.all([
      supabase
        .from('leads')
        .select('id, name, phone, feedback_response, feedback_responded_at, feedback_sent_at, is_active')
        .not('feedback_response', 'is', null)
        .order('feedback_responded_at', { ascending: false })
        .limit(200),
      supabase
        .from('lead_feedback_events')
        .select('id, name, phone, status, ok, detail, created_at')
        .eq('direction', 'IN')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    setRows((leads || []) as ResponseRow[]);
    setEvents((evs || []) as InEvent[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const keptCount = rows.filter((r) => r.feedback_response === 'STILL_SEARCHING' || r.feedback_response === 'PENDING').length;
  const doneCount = rows.filter((r) => r.feedback_response === 'NOT_SEARCHING' || r.feedback_response === 'DONE').length;

  return (
    <Card translate="no">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Respostas recebidas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Retornos que chegaram pelo webhook: {keptCount} querem manter o anúncio · {doneCount} pediram para desativar.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Resposta</TableHead>
                <TableHead>Respondido em</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    Nenhuma resposta recebida ainda.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name || '—'}</TableCell>
                    <TableCell>{r.phone || '—'}</TableCell>
                    <TableCell>
                      {r.feedback_response === 'NOT_SEARCHING' || r.feedback_response === 'DONE' ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600">Já não precisa</Badge>
                      ) : r.feedback_response === 'NO_RESPONSE' ? (
                        <Badge variant="destructive">Sem resposta</Badge>
                      ) : (
                        <Badge className="bg-amber-500 hover:bg-amber-500">Ainda procurando</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(r.feedback_responded_at)}</TableCell>
                    <TableCell>
                      {r.is_active ? (
                        <Badge variant="outline">Ativo</Badge>
                      ) : (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Últimos retornos do webhook</p>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum retorno registrado.</p>
          ) : (
            <div className="rounded-md border divide-y">
              {events.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <Badge variant="outline">Retorno</Badge>
                  <Badge
                    variant={e.ok ? 'default' : 'destructive'}
                    className={e.ok ? 'bg-emerald-600 hover:bg-emerald-600' : ''}
                  >
                    {e.ok ? 'Aplicado' : 'Falhou'}
                  </Badge>
                  <span className="font-medium">{e.name || '—'}</span>
                  <span className="text-muted-foreground">{e.phone}</span>
                  {e.status && <span className="text-muted-foreground">{e.status}</span>}
                  <span className="text-xs text-muted-foreground ml-auto">{formatDate(e.created_at)}</span>
                  {e.detail && <span className="w-full text-xs text-muted-foreground">{e.detail}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
