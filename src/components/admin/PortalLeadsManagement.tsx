import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Send } from 'lucide-react';
import { formatPhoneBR } from '@/lib/whatsapp';

interface PortalLead {
  id: string;
  name: string;
  phone: string;
  property_id: string;
  broker_user_id: string;
  webhook_status: string | null;
  webhook_last_error: string | null;
  webhook_sent_at: string | null;
  created_at: string;
}

export function PortalLeadsManagement() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<PortalLead[]>([]);
  const [properties, setProperties] = useState<Record<string, any>>({});
  const [brokers, setBrokers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sending, setSending] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('portal_property_leads' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    const rows = (data ?? []) as unknown as PortalLead[];
    setLeads(rows);

    const propIds = Array.from(new Set(rows.map((l) => l.property_id)));
    const brokerIds = Array.from(new Set(rows.map((l) => l.broker_user_id)));
    if (propIds.length) {
      const { data: props } = await supabase.from('properties').select('id, reference_code, title, city, state, property_type').in('id', propIds);
      setProperties(Object.fromEntries((props ?? []).map((p: any) => [p.id, p])));
    }
    if (brokerIds.length) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name, phone, email').in('id', brokerIds);
      setBrokers(Object.fromEntries((profs ?? []).map((p: any) => [p.id, p])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resend = async (id: string) => {
    setSending(id);
    const { data, error } = await supabase.functions.invoke('portal-lead-webhook', { body: { lead_id: id } });
    setSending(null);
    if (error) return toast({ title: 'Erro ao disparar', description: error.message, variant: 'destructive' });
    const res = data as any;
    toast({
      title: res?.dispatched ? 'Webhook disparado' : 'Webhook não configurado',
      description: res?.dispatched ? 'Lead enviado ao corretor.' : 'Configure a URL do webhook para enviar automaticamente.',
    });
    load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (status !== 'ALL' && (l.webhook_status || 'PENDING') !== status) return false;
      if (!q) return true;
      const prop = properties[l.property_id];
      return (
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q.replace(/\D/g, '')) ||
        String(prop?.reference_code || '').toLowerCase().includes(q)
      );
    });
  }, [leads, search, status, properties]);

  const statusBadge = (s: string | null) => {
    const v = s || 'PENDING';
    if (v === 'SENT') return <Badge className="bg-green-600">Enviado</Badge>;
    if (v === 'ERROR') return <Badge variant="destructive">Erro</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <CardTitle>Leads do Portal ({filtered.length})</CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Buscar por nome, telefone ou ref." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDING">Pendentes</SelectItem>
              <SelectItem value="SENT">Enviados</SelectItem>
              <SelectItem value="ERROR">Com erro</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Nenhum lead do portal ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Corretor</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => {
                  const prop = properties[l.property_id];
                  const broker = brokers[l.broker_user_id];
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell>{formatPhoneBR(l.phone)}</TableCell>
                      <TableCell className="text-xs">
                        {prop ? <>Ref. {prop.reference_code}<br /><span className="text-muted-foreground">{prop.city}/{prop.state}</span></> : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {broker ? <>{broker.full_name}<br /><span className="text-muted-foreground">{broker.phone ? formatPhoneBR(broker.phone) : broker.email}</span></> : '—'}
                      </TableCell>
                      <TableCell>
                        {statusBadge(l.webhook_status)}
                        {l.webhook_last_error && <p className="text-[11px] text-destructive mt-1 max-w-48 truncate" title={l.webhook_last_error}>{l.webhook_last_error}</p>}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => resend(l.id)} disabled={sending === l.id}>
                          {sending === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          <span className="ml-1">Disparar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
