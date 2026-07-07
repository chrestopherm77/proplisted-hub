import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useIBGELocation } from '@/hooks/useIBGELocation';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { resolveEventCoverUrl } from '@/lib/eventCoverImages';

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  state: string | null;
  city: string | null;
  location_name: string | null;
  external_url: string;
  cover_image_url: string | null;
  is_active: boolean;
  is_online: boolean;
  sort_order: number;
}

const emptyForm = {
  id: '',
  title: '',
  description: '',
  event_date: '',
  end_date: '',
  state: '',
  city: '',
  location_name: '',
  external_url: '',
  cover_image_url: '',
  is_active: true,
  is_online: false,
  sort_order: 0,
};

const COVER_WIDTH = 1600;
const COVER_HEIGHT = 1000;

const normalizeCoverImage = (file: File) => new Promise<File>((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('Envie um arquivo de imagem.'));
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = COVER_WIDTH;
      canvas.height = COVER_HEIGHT;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível preparar a imagem.');

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);

      const scale = Math.min(COVER_WIDTH / image.naturalWidth, COVER_HEIGHT / image.naturalHeight);
      const width = Math.round(image.naturalWidth * scale);
      const height = Math.round(image.naturalHeight * scale);
      const x = Math.round((COVER_WIDTH - width) / 2);
      const y = Math.round((COVER_HEIGHT - height) / 2);

      ctx.drawImage(image, x, y, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (!blob) {
          reject(new Error('Não foi possível converter a imagem.'));
          return;
        }
        resolve(new File([blob], 'capa-evento.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.88);
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    }
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Não foi possível ler essa imagem. Tente enviar em JPG ou PNG.'));
  };

  image.src = objectUrl;
});

export function EventsManagement() {
  const { toast } = useToast();
  const { states } = useIBGELocation();
  const [items, setItems] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [cities, setCities] = useState<{ id: number; nome: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewCoverUrl, setPreviewCoverUrl] = useState('');

  const fetchCities = async (uf: string) => {
    if (!uf) { setCities([]); return; }
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      const data = res.ok ? await res.json() : [];
      setCities(data);
    } catch { /* noop */ }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events' as any)
      .select('*')
      .order('event_date', { ascending: true });
    if (error) toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    setItems((data as any as EventRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let active = true;

    resolveEventCoverUrl(form.cover_image_url).then((url) => {
      if (active) setPreviewCoverUrl(url);
    });

    return () => { active = false; };
  }, [form.cover_image_url]);

  const openNew = () => {
    setForm({ ...emptyForm });
    setCities([]);
    setDialogOpen(true);
  };

  const toLocalInput = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openEdit = (e: EventRow) => {
    setForm({
      id: e.id,
      title: e.title,
      description: e.description || '',
      event_date: toLocalInput(e.event_date),
      end_date: toLocalInput(e.end_date),
      state: e.state || '',
      city: e.city || '',
      location_name: e.location_name || '',
      external_url: e.external_url,
      cover_image_url: e.cover_image_url || '',
      is_active: e.is_active,
      is_online: e.is_online ?? false,
      sort_order: e.sort_order,
    });
    if (e.state) fetchCities(e.state);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.event_date || !form.external_url) {
      toast({ title: 'Preencha título, data e link', variant: 'destructive' });
      return;
    }
    if (!form.is_online && (!form.state || !form.city)) {
      toast({ title: 'Para eventos presenciais informe UF e cidade', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: new Date(form.event_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        state: form.is_online ? null : form.state.toUpperCase().slice(0, 2),
        city: form.is_online ? null : form.city,
        location_name: form.location_name.trim() || null,
        external_url: form.external_url.trim(),
        cover_image_url: form.cover_image_url.trim() || null,
        is_active: form.is_active,
        is_online: form.is_online,
        sort_order: form.sort_order || 0,
      };
      const { error } = form.id
        ? await supabase.from('events' as any).update(payload).eq('id', form.id)
        : await supabase.from('events' as any).insert(payload);
      if (error) throw error;
      toast({ title: form.id ? 'Atualizado' : 'Criado' });
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (e: EventRow) => {
    const { error } = await supabase.from('events' as any).update({ is_active: !e.is_active }).eq('id', e.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    load();
  };

  const handleDelete = async (e: EventRow) => {
    if (!confirm(`Excluir "${e.title}"?`)) return;
    const { error } = await supabase.from('events' as any).delete().eq('id', e.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    load();
  };

  const uploadCover = async (file: File) => {
    const normalizedFile = await normalizeCoverImage(file);
    const path = `events/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: upErr } = await supabase.storage
      .from('news-images')
      .upload(path, normalizedFile, { upsert: false, contentType: 'image/jpeg' });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('news-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Eventos</CardTitle>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo evento</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Link</TableHead>
                <TableHead className="w-20">Ativo</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum evento cadastrado.</TableCell></TableRow>
              ) : items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell className="text-xs">{fmt(e.event_date)}</TableCell>
                  <TableCell className="text-xs">{e.is_online ? 'Online' : `${e.city}/${e.state}`}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">
                    <a href={e.external_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{e.external_url}</a>
                  </TableCell>
                  <TableCell><Switch checked={e.is_active} onCheckedChange={() => toggleActive(e)} /></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(e)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar evento' : 'Novo evento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data e hora *</Label>
                <Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Data fim (opcional)</Label>
                <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Switch
                checked={form.is_online}
                onCheckedChange={(v) => setForm({ ...form, is_online: v, ...(v ? { state: '', city: '' } : {}) })}
              />
              <Label className="cursor-pointer">Evento online (sem localização física)</Label>
            </div>
            {!form.is_online && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>UF *</Label>
                  <Select value={form.state} onValueChange={(v) => { setForm({ ...form, state: v, city: '' }); fetchCities(v); }}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {states.map((s) => <SelectItem key={s.sigla} value={s.sigla}>{s.sigla}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cidade *</Label>
                  <div className="flex gap-2">
                    <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })} disabled={!form.state}>
                      <SelectTrigger><SelectValue placeholder={form.state ? 'Selecione' : 'Escolha a UF'} /></SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.city && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, city: '' })}>
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Local (ex.: nome do espaço)</Label>
              <Input value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Link externo (compra/inscrição) *</Label>
              <Input placeholder="https://..." value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Imagem de capa</Label>
              <div className="flex items-center gap-3">
                {previewCoverUrl ? (
                  <img src={previewCoverUrl} alt="Capa" className="h-16 w-28 rounded-md object-contain border bg-muted" />
                ) : (
                  <div className="h-16 w-28 rounded-md border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">sem capa</div>
                )}
                <div className="flex-1 space-y-1">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const url = await uploadCover(file);
                        setForm((f) => ({ ...f, cover_image_url: url }));
                      } catch (err: any) {
                        toast({ title: 'Erro ao enviar imagem', description: err.message, variant: 'destructive' });
                      } finally {
                        setUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  {uploading && <p className="text-xs text-muted-foreground">Processando e enviando imagem...</p>}
                  <Input placeholder="ou cole uma URL" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || '0', 10) })} />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Ativo no site</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
