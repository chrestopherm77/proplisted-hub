import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useIBGELocation } from '@/hooks/useIBGELocation';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface Area {
  state: string;
  city: string;
  zone: string;
  neighborhood: string;
}

interface LandSearch {
  id: string;
  company_name: string;
  contact_name: string;
  contact_whatsapp: string;
  contact_email: string;
  min_area_m2: number | null;
  notes: string | null;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyArea: Area = { state: '', city: '', zone: '', neighborhood: '' };

const emptyForm = {
  id: '',
  company_name: '',
  contact_name: '',
  contact_whatsapp: '',
  contact_email: '',
  min_area_m2: '',
  notes: '',
  areas: [{ ...emptyArea }] as Area[],
};

export function LandSearchesManagement() {
  const { toast } = useToast();
  const { states } = useIBGELocation();
  const [items, setItems] = useState<(LandSearch & { areas: Area[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [areaCities, setAreaCities] = useState<Record<number, { id: number; nome: string }[]>>({});


  const fetchCitiesFor = async (idx: number, uf: string) => {
    if (!uf) { setAreaCities((m) => ({ ...m, [idx]: [] })); return; }
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      const data = res.ok ? await res.json() : [];
      setAreaCities((m) => ({ ...m, [idx]: data }));
    } catch { /* ignore */ }
  };

  const load = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('land_searches' as any)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    const list = (rows as any as LandSearch[]) || [];
    let areas: any[] = [];
    if (list.length > 0) {
      const { data } = await supabase
        .from('land_search_areas' as any)
        .select('*')
        .in('land_search_id', list.map((l) => l.id));
      areas = (data as any) || [];
    }
    setItems(list.map((l) => ({ ...l, areas: areas.filter((a: any) => a.land_search_id === l.id) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ ...emptyForm, areas: [{ ...emptyArea }] });
    setAreaCities({});
    setDialogOpen(true);
  };

  const openEdit = async (item: LandSearch & { areas: Area[] }) => {
    const areas = item.areas.length > 0
      ? item.areas.map((a: any) => ({
          state: a.state || '', city: a.city || '',
          zone: a.zone || '', neighborhood: a.neighborhood || '',
        }))
      : [{ ...emptyArea }];
    setForm({
      id: item.id,
      company_name: item.company_name,
      contact_name: item.contact_name,
      contact_whatsapp: item.contact_whatsapp,
      contact_email: item.contact_email,
      min_area_m2: item.min_area_m2?.toString() || '',
      notes: item.notes || '',
      areas,
    });
    setAreaCities({});
    setDialogOpen(true);
    await Promise.all(areas.map((a, i) => a.state ? fetchCitiesFor(i, a.state) : Promise.resolve()));
  };


  const updateArea = (idx: number, patch: Partial<Area>) => {
    setForm((f) => ({ ...f, areas: f.areas.map((a, i) => i === idx ? { ...a, ...patch } : a) }));
  };
  const addArea = () => setForm((f) => ({ ...f, areas: [...f.areas, { ...emptyArea }] }));
  const removeArea = (idx: number) => setForm((f) => ({
    ...f,
    areas: f.areas.length === 1 ? f.areas : f.areas.filter((_, i) => i !== idx),
  }));

  const handleSave = async () => {
    const validAreas = form.areas.filter((a) => a.state && a.city);
    if (!form.company_name || !form.contact_name || !form.contact_whatsapp || !form.contact_email || validAreas.length === 0) {
      toast({ title: 'Preencha empresa, contato, WhatsApp, e-mail e ao menos uma região (UF + cidade)', variant: 'destructive' });
      return;
    }
    const whatsapp = form.contact_whatsapp.replace(/\D/g, '');
    if (whatsapp.length !== 12) {
      toast({ title: 'WhatsApp inválido', description: 'Use 12 dígitos (55 + DDD + número, sem o 9).', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        company_name: form.company_name.trim(),
        contact_name: form.contact_name.trim(),
        contact_whatsapp: whatsapp,
        contact_email: form.contact_email.trim().toLowerCase(),
        min_area_m2: form.min_area_m2 ? Number(form.min_area_m2.replace(/\D/g, '')) : null,
        notes: form.notes.trim() || null,
        logo_url: form.logo_url.trim() || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      };

      let landSearchId = form.id;
      if (form.id) {
        const { error } = await supabase.from('land_searches' as any).update(payload).eq('id', form.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('land_searches' as any).insert(payload).select('id').single();
        if (error) throw error;
        landSearchId = (data as any).id;
      }

      // Substitui as áreas
      await supabase.from('land_search_areas' as any).delete().eq('land_search_id', landSearchId);
      const areasPayload = validAreas.map((a) => ({
        land_search_id: landSearchId,
        state: a.state.toUpperCase().slice(0, 2),
        city: a.city,
        zone: a.zone.trim() || null,
        neighborhood: a.neighborhood.trim() || null,
      }));
      if (areasPayload.length > 0) {
        const { error } = await supabase.from('land_search_areas' as any).insert(areasPayload);
        if (error) throw error;
      }

      toast({ title: form.id ? 'Atualizado' : 'Criado' });
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: LandSearch) => {
    const { error } = await supabase.from('land_searches' as any).update({ is_active: !item.is_active }).eq('id', item.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    load();
  };

  const handleDelete = async (item: LandSearch) => {
    if (!confirm(`Excluir "${item.company_name}"?`)) return;
    const { error } = await supabase.from('land_searches' as any).delete().eq('id', item.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    load();
  };

  const uploadLogo = async (file: File) => {
    const ext = file.name.split('.').pop() || 'png';
    const path = `land-searches/logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('brand-logos').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('brand-logos').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Procura-se de Terrenos</CardTitle>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo anúncio</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Construtora/Incorporadora</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Regiões</TableHead>
                <TableHead>Área mín.</TableHead>
                <TableHead className="w-20">Ativo</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum anúncio cadastrado.</TableCell></TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.company_name}</TableCell>
                  <TableCell className="text-xs">
                    <div>{item.contact_name}</div>
                    <div className="font-mono text-muted-foreground">{item.contact_whatsapp}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.areas.length === 0 ? '—' : item.areas.map((a: any) => `${a.city}/${a.state}`).join(' • ')}
                  </TableCell>
                  <TableCell className="text-xs">{item.min_area_m2 ? `${Number(item.min_area_m2).toLocaleString('pt-BR')} m²` : '—'}</TableCell>
                  <TableCell><Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} /></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{form.id ? 'Editar anúncio' : 'Novo anúncio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Construtora / Incorporadora / Fundo *</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nome do contato *</Label>
                <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp (12 dígitos) *</Label>
                <Input
                  value={form.contact_whatsapp}
                  placeholder="554399999999"
                  onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Área mínima (m²)</Label>
                <Input
                  type="number"
                  value={form.min_area_m2}
                  onChange={(e) => setForm({ ...form, min_area_m2: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Detalhes sobre o tipo de terreno procurado, prazos, formas de pagamento…"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Regiões de interesse *</Label>
                <Button type="button" size="sm" variant="outline" onClick={addArea}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar região
                </Button>
              </div>
              {form.areas.map((area, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_2fr_1fr_2fr_auto] gap-2 items-end border rounded-md p-2 bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-xs">UF</Label>
                    <Select
                      value={area.state}
                      onValueChange={(v) => { updateArea(idx, { state: v, city: '' }); fetchCitiesFor(idx, v); }}
                    >
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {states.map((s) => <SelectItem key={s.sigla} value={s.sigla}>{s.sigla}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cidade</Label>
                    <Select value={area.city} onValueChange={(v) => updateArea(idx, { city: v })} disabled={!area.state}>
                      <SelectTrigger><SelectValue placeholder={area.state ? 'Selecione' : 'UF primeiro'} /></SelectTrigger>
                      <SelectContent>
                        {(areaCities[idx] || []).map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Zona</Label>
                    <Input value={area.zone} placeholder="Sul" onChange={(e) => updateArea(idx, { zone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Bairro (opcional)</Label>
                    <Input value={area.neighborhood} onChange={(e) => updateArea(idx, { neighborhood: e.target.value })} />
                  </div>
                  <Button
                    type="button" size="icon" variant="ghost"
                    onClick={() => removeArea(idx)}
                    disabled={form.areas.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="h-14 w-14 rounded-md object-contain border bg-muted" />
                ) : (
                  <div className="h-14 w-14 rounded-md border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">sem logo</div>
                )}
                <div className="flex-1 space-y-1">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploadingLogo}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingLogo(true);
                      try {
                        const url = await uploadLogo(file);
                        setForm((f) => ({ ...f, logo_url: url }));
                      } catch (err: any) {
                        toast({ title: 'Erro ao enviar logo', description: err.message, variant: 'destructive' });
                      } finally {
                        setUploadingLogo(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <Input
                    placeholder="ou cole uma URL"
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Ativo (visível no site)</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
