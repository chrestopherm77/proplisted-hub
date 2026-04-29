import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LocationSelector } from '@/components/auth/LocationSelector';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';

interface Row {
  id: string;
  group_jid: string;
  group_label: string;
  city: string;
  uf: string;
  is_active: boolean;
  invite_url: string | null;
}

const empty: Row = { id: '', group_jid: '', group_label: '', city: '', uf: '', is_active: true, invite_url: '' };

export function WhatsappCityGroupsManagement() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Row>(empty);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_city_groups')
      .select('*')
      .order('group_label')
      .order('city');
    if (error) toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (r: Row) => { setForm(r); setOpen(true); };

  const save = async () => {
    if (!form.group_jid.endsWith('@g.us')) {
      toast({ title: 'JID inválido', description: 'Deve terminar em @g.us', variant: 'destructive' });
      return;
    }
    if (!form.group_label.trim() || !form.city.trim() || !form.uf.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      group_jid: form.group_jid.trim(),
      group_label: form.group_label.trim(),
      city: form.city.trim(),
      uf: form.uf.trim().toUpperCase(),
      is_active: form.is_active,
    };
    const { error } = form.id
      ? await supabase.from('whatsapp_city_groups').update(payload).eq('id', form.id)
      : await supabase.from('whatsapp_city_groups').insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: form.id ? 'Atualizado!' : 'Cadastrado!' });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este mapeamento?')) return;
    const { error } = await supabase.from('whatsapp_city_groups').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    load();
  };

  const toggle = async (r: Row) => {
    const { error } = await supabase.from('whatsapp_city_groups').update({ is_active: !r.is_active }).eq('id', r.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    load();
  };

  // Agrupa por group_label
  const grouped = rows.reduce<Record<string, Row[]>>((acc, r) => {
    const k = `${r.group_label} — ${r.group_jid}`;
    (acc[k] = acc[k] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupos de WhatsApp por Cidade</h1>
          <p className="text-sm text-muted-foreground">
            Roteamento dos disparos automáticos (leads, balcão, lançamentos, imóveis) para grupos do WhatsApp baseado na cidade.
          </p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo mapeamento</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">Nenhum mapeamento cadastrado.</Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([label, items]) => (
            <Card key={label} className="p-4">
              <div className="font-semibold mb-3">{label}</div>
              <div className="space-y-2">
                {items.map(r => (
                  <div key={r.id} className="flex items-center justify-between border rounded p-2">
                    <div className="flex items-center gap-3">
                      <Switch checked={r.is_active} onCheckedChange={() => toggle(r)} />
                      <span className={r.is_active ? '' : 'opacity-50 line-through'}>
                        {r.city} / {r.uf}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar mapeamento' : 'Novo mapeamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID do grupo (JID) *</Label>
              <Input
                value={form.group_jid}
                onChange={e => setForm({ ...form, group_jid: e.target.value })}
                placeholder="120363409744685071@g.us"
              />
            </div>
            <div>
              <Label>Rótulo do grupo *</Label>
              <Input
                value={form.group_label}
                onChange={e => setForm({ ...form, group_label: e.target.value })}
                placeholder="MG Histórico"
              />
            </div>
            <LocationSelector
              uf={form.uf}
              city={form.city}
              neighborhood=""
              onUFChange={uf => setForm({ ...form, uf, city: '' })}
              onCityChange={city => setForm({ ...form, city })}
              onNeighborhoodChange={() => {}}
            />
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
