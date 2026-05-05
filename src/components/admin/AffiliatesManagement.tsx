import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Copy, Loader2, Pencil, Eye, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface Affiliate {
  id: string; user_id: string | null; name: string; email: string; code: string;
  commission_percent: number; is_active: boolean; created_at: string;
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export function AffiliatesManagement() {
  const [list, setList] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<Record<string, { refs: number; paying: number; month: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<Affiliate | null>(null);
  const [editing, setEditing] = useState<Affiliate | null>(null);
  const [form, setForm] = useState({ name: '', email: '', code: '', commission_percent: 20, is_active: true });
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<{ refs: any[]; comms: any[] } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('affiliates').select('*').order('created_at', { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setList((data || []) as Affiliate[]);

    const { data: refs } = await supabase.from('affiliate_referrals').select('affiliate_id');
    const { data: comms } = await supabase.from('affiliate_commissions').select('affiliate_id, referred_user_id, commission_amount, reference_month');
    const monthStart = new Date(); monthStart.setDate(1);
    const ms = monthStart.toISOString().slice(0, 7);

    const s: typeof stats = {};
    (data || []).forEach((a: any) => {
      const r = (refs || []).filter((x: any) => x.affiliate_id === a.id).length;
      const cs = (comms || []).filter((x: any) => x.affiliate_id === a.id);
      const paying = new Set(cs.map((x: any) => x.referred_user_id)).size;
      const month = cs.filter((x: any) => String(x.reference_month).startsWith(ms)).reduce((sum: number, x: any) => sum + Number(x.commission_amount), 0);
      const total = cs.reduce((sum: number, x: any) => sum + Number(x.commission_amount), 0);
      s[a.id] = { refs: r, paying, month, total };
    });
    setStats(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', code: '', commission_percent: 20, is_active: true });
    setDialogOpen(true);
  };
  const openEdit = (a: Affiliate) => {
    setEditing(a);
    setForm({ name: a.name, email: a.email, code: a.code, commission_percent: a.commission_percent, is_active: a.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Nome e email obrigatórios'); return; }
    const code = slugify(form.code || form.name);
    if (!code) { toast.error('Código inválido'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      code,
      commission_percent: Number(form.commission_percent) || 0,
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from('affiliates').update(payload).eq('id', editing.id)
      : await supabase.from('affiliates').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? 'Afiliado atualizado!' : 'Afiliado criado!');
    setDialogOpen(false);
    load();
  };

  const openDetail = async (a: Affiliate) => {
    setDetailOpen(a);
    setDetails(null);
    const [{ data: refs }, { data: comms }] = await Promise.all([
      supabase.from('affiliate_referrals').select('*, profile:profiles!affiliate_referrals_referred_user_id_fkey(name, email)').eq('affiliate_id', a.id).order('created_at', { ascending: false }),
      supabase.from('affiliate_commissions').select('*').eq('affiliate_id', a.id).order('created_at', { ascending: false }),
    ]);
    setDetails({ refs: refs || [], comms: comms || [] });
  };

  const togglePaid = async (id: string, current: string) => {
    const next = current === 'PAID' ? 'PENDING' : 'PAID';
    const { error } = await supabase.from('affiliate_commissions').update({ status: next, paid_at: next === 'PAID' ? new Date().toISOString() : null }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Status atualizado');
    if (detailOpen) openDetail(detailOpen);
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/?aff=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Afiliados</h2>
        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Afiliado</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Código / Link</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Cadastros</TableHead>
                <TableHead>Pagantes</TableHead>
                <TableHead>Mês</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum afiliado</TableCell></TableRow>
              ) : list.map((a) => {
                const s = stats[a.id] || { refs: 0, paying: 0, month: 0, total: 0 };
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{a.code}</code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyLink(a.code)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                    <TableCell>{a.commission_percent}%</TableCell>
                    <TableCell>{s.refs}</TableCell>
                    <TableCell>{s.paying}</TableCell>
                    <TableCell>{fmt(s.month)}</TableCell>
                    <TableCell className="font-semibold">{fmt(s.total)}</TableCell>
                    <TableCell><Badge variant={a.is_active ? 'default' : 'secondary'}>{a.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openDetail(a)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Afiliado' : 'Novo Afiliado'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, code: editing ? form.code : slugify(e.target.value) })} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="O usuário deve se cadastrar com este email" /></div>
            <div>
              <Label>Código do link</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: slugify(e.target.value) })} placeholder="ex: joao-silva" />
              <p className="text-xs text-muted-foreground mt-1">Link: <code>{window.location.origin}/?aff={form.code || 'codigo'}</code></p>
            </div>
            <div>
              <Label>Percentual de comissão (%)</Label>
              <Input type="number" min={0} max={100} step="0.01" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Ativo</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Salvar' : 'Criar Afiliado'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailOpen} onOpenChange={(o) => !o && setDetailOpen(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes — {detailOpen?.name}</DialogTitle></DialogHeader>
          {!details ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Cadastros indicados ({details.refs.length})</h3>
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {details.refs.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sem cadastros ainda</TableCell></TableRow>
                      : details.refs.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.profile?.name || '—'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{r.profile?.email || '—'}</TableCell>
                          <TableCell>{new Date(r.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Comissões ({details.comms.length})</h3>
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Plano</TableHead><TableHead>Pago</TableHead><TableHead>Comissão</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {details.comms.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem comissões ainda</TableCell></TableRow>
                      : details.comms.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell>{new Date(c.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{c.plan_name || c.plan_slug || '—'}</TableCell>
                          <TableCell>{fmt(Number(c.gross_amount))}</TableCell>
                          <TableCell className="font-semibold">{fmt(Number(c.commission_amount))}</TableCell>
                          <TableCell><Badge variant={c.status === 'PAID' ? 'default' : 'secondary'}>{c.status === 'PAID' ? 'Pago' : 'A receber'}</Badge></TableCell>
                          <TableCell><Button size="sm" variant="outline" onClick={() => togglePaid(c.id, c.status)}>{c.status === 'PAID' ? 'Marcar pendente' : 'Marcar pago'}</Button></TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
