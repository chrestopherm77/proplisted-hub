import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Row {
  purchase_id: string;
  user_name: string;
  lead_name: string;
  lead_created_at: string;
  purchased_at: string;
  first_contact_at: string | null;
  contact_count: number;
}

export function LeadContactTracking() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'CONTACTED' | 'PENDING'>('ALL');
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`id, purchased_at, first_contact_at, contact_count, user_id,
          leads ( name, created_at )`)
        .eq('status', 'PAID')
        .order('purchased_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((p: any) => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      const profMap = new Map((profiles || []).map((p: any) => [p.id, p.name]));

      setRows((data || []).map((p: any) => ({
        purchase_id: p.id,
        user_name: profMap.get(p.user_id) || 'Usuário desconhecido',
        lead_name: p.leads?.name || 'Lead removido',
        lead_created_at: p.leads?.created_at || '',
        purchased_at: p.purchased_at,
        first_contact_at: p.first_contact_at,
        contact_count: p.contact_count || 0,
      })));
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro ao carregar rastreio', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === 'CONTACTED' && !r.first_contact_at) return false;
      if (filter === 'PENDING' && r.first_contact_at) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!r.user_name.toLowerCase().includes(s) && !r.lead_name.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, filter, search]);

  const fmt = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const elapsed = (purchasedAt: string, contactAt: string | null) => {
    if (!contactAt) return '—';
    const ms = new Date(contactAt).getTime() - new Date(purchasedAt).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h ${min % 60}min`;
    return `${Math.floor(h / 24)}d ${h % 24}h`;
  };

  if (loading) return <div className="text-center py-12">Carregando rastreio...</div>;

  const contacted = rows.filter((r) => r.first_contact_at).length;
  const pending = rows.length - contacted;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Rastreio de Contato com Leads</CardTitle>
        <div className="flex gap-3 text-sm text-muted-foreground mt-2">
          <span>Total: <strong>{rows.length}</strong></span>
          <span className="text-green-700">Contatados: <strong>{contacted}</strong></span>
          <span className="text-amber-700">Sem contato: <strong>{pending}</strong></span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-4 flex-wrap">
          <Input
            placeholder="Buscar corretor ou lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="CONTACTED">Contatados</SelectItem>
              <SelectItem value="PENDING">Sem contato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Lead criado em</TableHead>
                <TableHead>Comprado em</TableHead>
                <TableHead>1º contato</TableHead>
                <TableHead>Tempo até contato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.purchase_id}>
                  <TableCell className="text-sm font-medium">{r.user_name}</TableCell>
                  <TableCell className="text-sm">{r.lead_name}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{fmt(r.lead_created_at)}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{fmt(r.purchased_at)}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {r.first_contact_at ? (
                      <div className="flex flex-col">
                        <span>{fmt(r.first_contact_at)}</span>
                        {r.contact_count > 1 && (
                          <span className="text-xs text-muted-foreground">{r.contact_count} cliques</span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="destructive">Sem contato</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{elapsed(r.purchased_at, r.first_contact_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum registro encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
