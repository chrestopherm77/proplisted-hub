import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useIBGELocation } from '@/hooks/useIBGELocation';
import { Plus, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';

interface Area { state: string; city: string; zone: string; neighborhood: string; }

const emptyArea: Area = { state: '', city: '', zone: '', neighborhood: '' };
const emptyForm = {
  id: '', company_name: '', contact_name: '', contact_whatsapp: '',
  contact_email: '', min_area_m2: '', notes: '',
  areas: [{ ...emptyArea }] as Area[],
};

export default function MyLandSearches() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { states } = useIBGELocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [areaCities, setAreaCities] = useState<Record<number, { id: number; nome: string }[]>>({});

  const fetchCitiesFor = async (idx: number, uf: string) => {
    if (!uf) { setAreaCities((m) => ({ ...m, [idx]: [] })); return; }
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      const data = res.ok ? await res.json() : [];
      setAreaCities((m) => ({ ...m, [idx]: data }));
    } catch {}
  };

  const checkPermission = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('land_search_publish_permissions' as any)
      .select('id').eq('user_id', user.id).maybeSingle();
    setAllowed(!!data);
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from('land_searches' as any)
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const list = (rows as any) || [];
    let areas: any[] = [];
    if (list.length > 0) {
      const { data } = await supabase
        .from('land_search_areas' as any).select('*')
        .in('land_search_id', list.map((l: any) => l.id));
      areas = (data as any) || [];
    }
    setItems(list.map((l: any) => ({ ...l, areas: areas.filter((a: any) => a.land_search_id === l.id) })));
    setLoading(false);
  }, [user]);

  useEffect(() => { checkPermission(); load(); }, [checkPermission, load]);

  const openNew = () => { setForm({ ...emptyForm, areas: [{ ...emptyArea }] }); setAreaCities({}); setDialogOpen(true); };
  const openEdit = async (item: any) => {
    const areas = item.areas?.length > 0 ? item.areas.map((a: any) => ({
      state: a.state || '', city: a.city || '', zone: a.zone || '', neighborhood: a.neighborhood || '',
    })) : [{ ...emptyArea }];
    setForm({
      id: item.id, company_name: item.company_name, contact_name: item.contact_name,
      contact_whatsapp: item.contact_whatsapp, contact_email: item.contact_email,
      min_area_m2: item.min_area_m2?.toString() || '', notes: item.notes || '', areas,
    });
    setAreaCities({});
    setDialogOpen(true);
    await Promise.all(areas.map((a: Area, i: number) => a.state ? fetchCitiesFor(i, a.state) : Promise.resolve()));
  };

  const updateArea = (idx: number, patch: Partial<Area>) =>
    setForm((f) => ({ ...f, areas: f.areas.map((a, i) => i === idx ? { ...a, ...patch } : a) }));
  const addArea = () => setForm((f) => ({ ...f, areas: [...f.areas, { ...emptyArea }] }));
  const removeArea = (idx: number) => setForm((f) => ({
    ...f, areas: f.areas.length === 1 ? f.areas : f.areas.filter((_, i) => i !== idx),
  }));

  const handleSave = async () => {
    if (!user) return;
    const validAreas = form.areas.filter((a) => a.state && a.city);
    if (!form.company_name || !form.contact_name || !form.contact_whatsapp || !form.contact_email || validAreas.length === 0) {
      toast({ title: 'Preencha empresa, contato, WhatsApp, e-mail e ao menos uma região (UF + cidade)', variant: 'destructive' });
      return;
    }
    const whatsapp = form.contact_whatsapp.replace(/\D/g, '');
    if (whatsapp.length !== 12) {
      toast({ title: 'WhatsApp inválido', description: 'Use 12 dígitos (55 + DDD + número).', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        company_name: form.company_name.trim(),
        contact_name: form.contact_name.trim(),
        contact_whatsapp: whatsapp,
        contact_email: form.contact_email.trim().toLowerCase(),
        min_area_m2: form.min_area_m2 ? Number(form.min_area_m2.replace(/\D/g, '')) : null,
        notes: form.notes.trim() || null,
      };
      let id = form.id;
      if (form.id) {
        const { error } = await supabase.from('land_searches' as any).update(payload).eq('id', form.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('land_searches' as any).insert(payload).select('id').single();
        if (error) throw error;
        id = (data as any).id;
      }
      await supabase.from('land_search_areas' as any).delete().eq('land_search_id', id);
      const areasPayload = validAreas.map((a) => ({
        land_search_id: id,
        state: a.state.toUpperCase().slice(0, 2),
        city: a.city,
        zone: a.zone.trim() || null,
        neighborhood: a.neighborhood.trim() || null,
      }));
      if (areasPayload.length > 0) {
        const { error } = await supabase.from('land_search_areas' as any).insert(areasPayload);
        if (error) throw error;
      }
      toast({ title: form.id ? 'Atualizado' : 'Publicado' });
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Excluir "${item.company_name}"?`)) return;
    const { error } = await supabase.from('land_searches' as any).delete().eq('id', item.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    load();
  };

  if (authLoading) return <Layout><div className="container py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div></Layout>;
  if (!user) return <Navigate to="/auth" replace />;
  if (allowed === null) return <Layout><div className="container py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div></Layout>;
  if (allowed === false) {
    return (
      <Layout>
        <div className="container py-10" translate="no">
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground" />
              <h1 className="text-xl font-semibold">Publicação restrita</h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                A publicação de anúncios em "Procura-se de Terrenos" precisa ser liberada manualmente pelo administrador.
                Entre em contato com o suporte para solicitar acesso.
              </p>
              <Button asChild variant="outline"><Link to="/procura-se-terrenos">Ver anúncios</Link></Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6" translate="no">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Meus anúncios de Procura-se de Terrenos</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Gerencie os anúncios da sua construtora/incorporadora.</p>
            </div>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo anúncio</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Construtora/Incorporadora</TableHead>
                  <TableHead>Regiões</TableHead>
                  <TableHead>Área mín.</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum anúncio. Clique em "Novo anúncio" para publicar.
                    </TableCell></TableRow>
                  ) : items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.company_name}</TableCell>
                      <TableCell className="text-xs">
                        {item.areas.length === 0 ? '—' : item.areas.map((a: any) => `${a.city}/${a.state}`).join(' • ')}
                      </TableCell>
                      <TableCell className="text-xs">{item.min_area_m2 ? `${Number(item.min_area_m2).toLocaleString('pt-BR')} m²` : '—'}</TableCell>
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
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? 'Editar anúncio' : 'Novo anúncio'}</DialogTitle></DialogHeader>
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
                  <Input value={form.contact_whatsapp} placeholder="554399999999"
                    onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>E-mail *</Label>
                  <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Área mínima (m²)</Label>
                  <Input type="number" value={form.min_area_m2}
                    onChange={(e) => setForm({ ...form, min_area_m2: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea rows={3} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Detalhes sobre o tipo de terreno procurado, prazos…" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Regiões de interesse *</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addArea}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                  </Button>
                </div>
                {form.areas.map((area, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_2fr_1fr_2fr_auto] gap-2 items-end border rounded-md p-2 bg-muted/30">
                    <div className="space-y-1">
                      <Label className="text-xs">UF</Label>
                      <Select value={area.state}
                        onValueChange={(v) => { updateArea(idx, { state: v, city: '' }); fetchCitiesFor(idx, v); }}>
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
                    <Button type="button" size="icon" variant="ghost"
                      onClick={() => removeArea(idx)} disabled={form.areas.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
