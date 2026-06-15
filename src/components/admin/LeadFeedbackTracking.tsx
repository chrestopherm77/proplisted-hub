import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

type IntentionKey = 'BUY' | 'RENT' | 'SELL' | 'BUILD';

const INTENTION_LABEL: Record<IntentionKey, string> = {
  BUY: 'Comprar',
  RENT: 'Alugar',
  SELL: 'Vender',
  BUILD: 'Construir',
};

interface Row {
  id: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  uf: string | null;
  intention: IntentionKey | null;
  created_at: string;
  feedback_sent_at: string | null;
  feedback_attempts: number;
  feedback_response: 'DONE' | 'PENDING' | null;
  feedback_responded_at: string | null;
  is_active: boolean;
  is_exhausted: boolean;
}

type StatusFilter =
  | 'ALL'
  | 'NOT_SENT'
  | 'SENT_NO_REPLY'
  | 'PENDING'
  | 'DONE'
  | 'EXHAUSTED';

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function getIntention(formData: any): IntentionKey | null {
  const i = String(formData?.intention || '').toUpperCase();
  if (i === 'BUY' || i === 'RENT' || i === 'SELL' || i === 'BUILD') return i;
  return null;
}

function getCity(formData: any): { city: string | null; uf: string | null } {
  return {
    city: formData?.city || formData?.cidade || null,
    uf: formData?.uf || formData?.state || null,
  };
}

export function LeadFeedbackTracking() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [period, setPeriod] = useState<'ALL' | '7' | '30' | '90'>('ALL');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(
          'id, name, phone, form_data, created_at, feedback_sent_at, feedback_attempts, feedback_response, feedback_responded_at, is_active, is_exhausted',
        )
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;

      setRows(
        (data || []).map((l: any) => {
          const { city, uf } = getCity(l.form_data);
          return {
            id: l.id,
            name: l.name,
            phone: l.phone,
            city,
            uf,
            intention: getIntention(l.form_data),
            created_at: l.created_at,
            feedback_sent_at: l.feedback_sent_at,
            feedback_attempts: l.feedback_attempts || 0,
            feedback_response: l.feedback_response,
            feedback_responded_at: l.feedback_responded_at,
            is_active: !!l.is_active,
            is_exhausted: !!l.is_exhausted,
          } as Row;
        }),
      );
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro ao carregar feedback', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const cutoff =
      period === 'ALL'
        ? null
        : new Date(Date.now() - parseInt(period, 10) * 24 * 60 * 60 * 1000);
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (cutoff && new Date(r.created_at) < cutoff) return false;
      if (q) {
        const hay = `${r.name || ''} ${r.phone || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      switch (status) {
        case 'NOT_SENT':
          return !r.feedback_sent_at;
        case 'SENT_NO_REPLY':
          return !!r.feedback_sent_at && !r.feedback_response;
        case 'PENDING':
          return r.feedback_response === 'PENDING';
        case 'DONE':
          return r.feedback_response === 'DONE';
        case 'EXHAUSTED':
          return r.is_exhausted || !r.is_active;
        default:
          return true;
      }
    });
  }, [rows, search, status, period]);

  const summary = useMemo(() => {
    const total = rows.length;
    const sent = rows.filter((r) => !!r.feedback_sent_at).length;
    const responded = rows.filter((r) => !!r.feedback_response).length;
    const noReplyMaxAttempts = rows.filter(
      (r) => r.feedback_attempts >= 2 && !r.feedback_response,
    ).length;
    const removed = rows.filter((r) => r.is_exhausted || !r.is_active).length;
    return { total, sent, responded, noReplyMaxAttempts, removed };
  }, [rows]);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando feedback...</div>;
  }

  return (
    <div className="space-y-6" translate="no">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Feedback de Leads</h2>
        <p className="text-sm text-muted-foreground">
          Acompanhe a automação de feedback enviada por WhatsApp para os leads ativos.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Total" value={summary.total} />
        <SummaryCard label="Enviados" value={summary.sent} />
        <SummaryCard label="Respondidos" value={summary.responded} />
        <SummaryCard label="Sem resposta (2 tentativas)" value={summary.noReplyMaxAttempts} />
        <SummaryCard label="Removidos / Esgotados" value={summary.removed} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Buscar por nome ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-xs"
            />
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="md:max-w-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="NOT_SENT">Não enviado</SelectItem>
                <SelectItem value="SENT_NO_REPLY">Enviado sem resposta</SelectItem>
                <SelectItem value="PENDING">Ainda procurando</SelectItem>
                <SelectItem value="DONE">Já não precisa</SelectItem>
                <SelectItem value="EXHAUSTED">Removidos / Esgotados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="md:max-w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todo o período</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Intenção</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Envio</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Resposta</TableHead>
                  <TableHead>Respondido em</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-6">
                      Nenhum lead encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name || '—'}</TableCell>
                      <TableCell>{r.phone || '—'}</TableCell>
                      <TableCell>
                        {r.intention ? INTENTION_LABEL[r.intention] : '—'}
                      </TableCell>
                      <TableCell>
                        {r.city ? `${r.city}${r.uf ? '/' + r.uf : ''}` : '—'}
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(r.created_at)}</TableCell>
                      <TableCell className="text-xs">
                        {r.feedback_sent_at ? (
                          <span>
                            {formatDate(r.feedback_sent_at)}
                            {r.feedback_attempts > 1 && (
                              <Badge variant="outline" className="ml-2">
                                Reenviado
                              </Badge>
                            )}
                          </span>
                        ) : (
                          <Badge variant="secondary">Não enviado</Badge>
                        )}
                      </TableCell>
                      <TableCell>{r.feedback_attempts}</TableCell>
                      <TableCell>
                        {r.feedback_response === 'DONE' ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">
                            Já não precisa
                          </Badge>
                        ) : r.feedback_response === 'PENDING' ? (
                          <Badge className="bg-amber-500 hover:bg-amber-500">
                            Ainda procurando
                          </Badge>
                        ) : r.feedback_sent_at ? (
                          <Badge variant="outline">Aguardando</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(r.feedback_responded_at)}
                      </TableCell>
                      <TableCell>
                        {r.is_exhausted ? (
                          <Badge variant="destructive">Esgotado</Badge>
                        ) : !r.is_active ? (
                          <Badge variant="destructive">Removido</Badge>
                        ) : (
                          <Badge variant="outline">Ativo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
