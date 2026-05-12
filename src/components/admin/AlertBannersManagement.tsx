import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Banner {
  id: string;
  title: string | null;
  message: string;
  link_url: string | null;
  link_label: string | null;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  dismissible: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const empty: Partial<Banner> = {
  title: '',
  message: '',
  link_url: '',
  link_label: '',
  bg_color: '#1e40af',
  text_color: '#ffffff',
  is_active: true,
  dismissible: true,
  priority: 0,
};

export const AlertBannersManagement = () => {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alert_banners')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar banners');
    else setItems((data ?? []) as Banner[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.message?.trim()) {
      toast.error('Mensagem é obrigatória');
      return;
    }
    setSaving(true);
    const payload = {
      title: editing.title || null,
      message: editing.message,
      link_url: editing.link_url || null,
      link_label: editing.link_label || null,
      bg_color: editing.bg_color || '#1e40af',
      text_color: editing.text_color || '#ffffff',
      is_active: editing.is_active ?? true,
      dismissible: editing.dismissible ?? true,
      priority: editing.priority ?? 0,
      starts_at: editing.starts_at || null,
      ends_at: editing.ends_at || null,
    };
    const { error } = editing.id
      ? await supabase.from('alert_banners').update(payload).eq('id', editing.id)
      : await supabase.from('alert_banners').insert(payload);
    setSaving(false);
    if (error) return toast.error('Erro ao salvar: ' + error.message);
    toast.success('Banner salvo!');
    setEditing(null);
    load();
  };

  const toggleActive = async (b: Banner) => {
    const { error } = await supabase.from('alert_banners').update({ is_active: !b.is_active }).eq('id', b.id);
    if (error) toast.error('Erro ao atualizar');
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este banner?')) return;
    const { error } = await supabase.from('alert_banners').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else { toast.success('Excluído'); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banners de Alerta</h1>
          <p className="text-sm text-muted-foreground">Faixa de aviso exibida no topo da área logada (Lives, reuniões, avaliações, etc.)</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>
          <Plus className="h-4 w-4 mr-1" /> Novo banner
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhum banner cadastrado.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <Card key={b.id} className="p-4">
              <div
                className="rounded px-3 py-2 mb-3 text-sm flex items-center gap-2 flex-wrap"
                style={{ backgroundColor: b.bg_color, color: b.text_color }}
              >
                {b.title && <strong>{b.title}</strong>}
                <span>{b.message}</span>
                {b.link_url && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                    {b.link_label || 'Link'} <ExternalLink className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>Prioridade: {b.priority}</span>
                  <span>{b.dismissible ? 'Dispensável' : 'Fixo'}</span>
                  {b.is_active ? <span className="text-green-600 font-medium">Ativo</span> : <span>Inativo</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(b)}>
                    {b.is_active ? <><EyeOff className="h-4 w-4 mr-1" /> Desativar</> : <><Eye className="h-4 w-4 mr-1" /> Ativar</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(b)}>
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar banner' : 'Novo banner'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Título (opcional)</Label>
                <Input value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Ex: Live hoje às 20h" />
              </div>
              <div>
                <Label>Mensagem *</Label>
                <Textarea value={editing.message ?? ''} onChange={(e) => setEditing({ ...editing, message: e.target.value })} rows={2} placeholder="Texto exibido no banner" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>URL do botão</Label>
                  <Input value={editing.link_url ?? ''} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>Texto do botão</Label>
                  <Input value={editing.link_label ?? ''} onChange={(e) => setEditing({ ...editing, link_label: e.target.value })} placeholder="Participar / Agendar / Avaliar" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Cor de fundo</Label>
                  <Input type="color" value={editing.bg_color ?? '#1e40af'} onChange={(e) => setEditing({ ...editing, bg_color: e.target.value })} />
                </div>
                <div>
                  <Label>Cor do texto</Label>
                  <Input type="color" value={editing.text_color ?? '#ffffff'} onChange={(e) => setEditing({ ...editing, text_color: e.target.value })} />
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Input type="number" value={editing.priority ?? 0} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Início (opcional)</Label>
                  <Input type="datetime-local" value={editing.starts_at ? editing.starts_at.slice(0, 16) : ''} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value || null })} />
                </div>
                <div>
                  <Label>Fim (opcional)</Label>
                  <Input type="datetime-local" value={editing.ends_at ? editing.ends_at.slice(0, 16) : ''} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value || null })} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.dismissible ?? true} onCheckedChange={(v) => setEditing({ ...editing, dismissible: v })} />
                  Usuário pode fechar
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
