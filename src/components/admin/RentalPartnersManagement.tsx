import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useIBGELocation } from '@/hooks/useIBGELocation';
import { Plus, Pencil, Trash2, Loader2, Search, X, CheckCircle2 } from 'lucide-react';

interface ProfileOption { id: string; email: string | null; name: string | null }

interface ServiceArea { state: string; city: string }

interface Partner {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  website_url: string | null;
  commission_text: string | null;
  commission_tenant_text: string | null;
  commission_tenant_when: string | null;
  commission_owner_text: string | null;
  commission_owner_when: string | null;
  whatsapp_phone: string;
  state: string;
  city: string;
  is_active: boolean;
  sort_order: number;
  owner_user_id: string | null;
  service_areas: ServiceArea[] | null;
}

const emptyForm = {
  id: '',
  name: '',
  logo_url: '',
  banner_url: '',
  website_url: '',
  commission_tenant_text: '',
  commission_tenant_when: 'FIRST_PAYMENT',
  commission_owner_text: '',
  commission_owner_when: 'FIRST_PAYMENT',
  whatsapp_phone: '',
  is_active: false,
  owner_user_id: '' as string,
  owner_email: '',
  owner_name: '',
  service_areas: [{ state: '', city: '' }] as ServiceArea[],
};

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export function RentalPartnersManagement() {
  const { toast } = useToast();
  const { states } = useIBGELocation();
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerResults, setOwnerResults] = useState<ProfileOption[]>([]);
  const [searchingOwner, setSearchingOwner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [areaCities, setAreaCities] = useState<Record<number, { id: number; nome: string }[]>>({});

  useEffect(() => {
    const q = ownerSearch.trim();
    if (!q || q.length < 2) { setOwnerResults([]); return; }
    let cancel = false;
    setSearchingOwner(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id,email,name')
        .or(`email.ilike.%${q}%,name.ilike.%${q}%`)
        .not('email', 'is', null)
        .limit(15);
      if (!cancel) {
        setOwnerResults((data as ProfileOption[]) || []);
        setSearchingOwner(false);
      }
    }, 250);
    return () => { cancel = true; clearTimeout(t); };
  }, [ownerSearch]);

  const fetchCitiesFor = async (idx: number, uf: string) => {
    if (!uf) {
      setAreaCities((m) => ({ ...m, [idx]: [] }));
      return;
    }
    try {
      const res = await fetch(`https://servicodogeografiaeestatistica.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      const data = res.ok ? await res.json() : [];
      setAreaCities((m) => ({ ...m, [idx]: data }));
    } catch {
      // fallback to public IBGE API
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        const data = await res.json();
        setAreaCities((m) => ({ ...m, [idx]: data }));
      } catch { /* ignore */ }
    }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rental_partners')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    setItems((data as any as Partner[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const initFormAreas = async (areas: ServiceArea[]) => {
    setAreaCities({});
    await Promise.all(areas.map((a, i) => a.state ? fetchCitiesFor(i, a.state) : Promise.resolve()));
  };

  const openNew = () => {
    setForm({ ...emptyForm, service_areas: [{ state: '', city: '' }] });
    setOwnerSearch('');
    setOwnerResults([]);
    setAreaCities({});
    setDialogOpen(true);
  };

  const openEdit = async (p: Partner) => {
    let owner_email = '';
    let owner_name = '';
    if (p.owner_user_id) {
      const { data } = await supabase
        .from('profiles')
        .select('email,name')
        .eq('id', p.owner_user_id)
        .single();
      owner_email = (data as any)?.email || '';
      owner_name = (data as any)?.name || '';
    }
    const areas: ServiceArea[] = (Array.isArray(p.service_areas) && p.service_areas.length > 0)
      ? p.service_areas
      : [{ state: p.state || '', city: p.city || '' }];
    setForm({
      id: p.id,
      name: p.name,
      logo_url: p.logo_url || '',
      banner_url: p.banner_url || '',
      website_url: p.website_url || '',
      commission_tenant_text: p.commission_tenant_text || '',
      commission_tenant_when: p.commission_tenant_when || 'FIRST_PAYMENT',
      commission_owner_text: p.commission_owner_text || '',
      commission_owner_when: p.commission_owner_when || 'FIRST_PAYMENT',
      whatsapp_phone: p.whatsapp_phone,
      is_active: p.is_active,
      owner_user_id: p.owner_user_id || '',
      owner_email,
      owner_name,
      service_areas: areas,
    });
    setOwnerSearch('');
    setOwnerResults([]);
    setDialogOpen(true);
    initFormAreas(areas);
  };

  const updateArea = (idx: number, patch: Partial<ServiceArea>) => {
    setForm((f) => ({
      ...f,
      service_areas: f.service_areas.map((a, i) => i === idx ? { ...a, ...patch } : a),
    }));
  };

  const addArea = () => {
    setForm((f) => ({ ...f, service_areas: [...f.service_areas, { state: '', city: '' }] }));
  };

  const removeArea = (idx: number) => {
    setForm((f) => ({
      ...f,
      service_areas: f.service_areas.length === 1 ? f.service_areas : f.service_areas.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    const validAreas = form.service_areas.filter((a) => a.state && a.city);
    if (!form.name || !form.whatsapp_phone || validAreas.length === 0) {
      toast({ title: 'Preencha nome, WhatsApp e ao menos uma região (UF + cidade)', variant: 'destructive' });
      return;
    }
    if (!form.owner_user_id) {
      toast({
        title: 'Selecione a imobiliária dona',
        description: 'Escolha um usuário cadastrado para liberar a publicação.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      const primary = validAreas[0];
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.name) || `parceira-${Date.now()}`,
        logo_url: form.logo_url.trim() || null,
        banner_url: form.banner_url.trim() || null,
        website_url: form.website_url.trim() || null,
        commission_tenant_text: form.commission_tenant_text.trim() || null,
        commission_tenant_when: form.commission_tenant_text.trim() ? form.commission_tenant_when : null,
        commission_owner_text: form.commission_owner_text.trim() || null,
        commission_owner_when: form.commission_owner_text.trim() ? form.commission_owner_when : null,
        whatsapp_phone: form.whatsapp_phone.replace(/\D/g, ''),
        state: primary.state.toUpperCase().slice(0, 2),
        city: primary.city,
        is_active: form.is_active,
        owner_user_id: form.owner_user_id,
        service_areas: validAreas.map((a) => ({ state: a.state.toUpperCase().slice(0, 2), city: a.city })),
      };

      const { error } = form.id
        ? await supabase.from('rental_partners').update(payload).eq('id', form.id)
        : await supabase.from('rental_partners').insert(payload);

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

  const toggleActive = async (p: Partner) => {
    if (!p.is_active && !p.owner_user_id) {
      toast({
        title: 'Vincule uma imobiliária',
        description: 'Edite a parceira e selecione o usuário dono antes de publicar.',
        variant: 'destructive',
      });
      return;
    }
    const { error } = await supabase
      .from('rental_partners')
      .update({ is_active: !p.is_active })
      .eq('id', p.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    load();
  };

  const handleDelete = async (p: Partner) => {
    if (!confirm(`Excluir "${p.name}"?`)) return;
    const { error } = await supabase.from('rental_partners').delete().eq('id', p.id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    load();
  };

  const uploadImage = async (file: File, prefix: string) => {
    const ext = file.name.split('.').pop() || 'png';
    const path = `rental-partners/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('brand-logos').upload(path, file, { upsert: true });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('brand-logos').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Imobs Parceiras — Alugue em Parceria</CardTitle>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova parceira</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Regiões</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead className="w-20">Ativo</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma parceira cadastrada.</TableCell></TableRow>
              ) : items.map((p) => {
                const areas = (Array.isArray(p.service_areas) && p.service_areas.length > 0)
                  ? p.service_areas
                  : [{ state: p.state, city: p.city }];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs">{areas.map((a) => `${a.city}/${a.state}`).join(' • ')}</TableCell>
                    <TableCell className="font-mono text-xs">{p.whatsapp_phone}</TableCell>
                    <TableCell><Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(p)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar parceira' : 'Nova parceira'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>WhatsApp (com DDD) *</Label>
              <Input
                value={form.whatsapp_phone}
                placeholder="43996102805"
                onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Será salvo apenas com dígitos.</p>
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                placeholder="https://imobiliaria.com.br"
                value={form.website_url}
                onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Regiões atendidas *</Label>
                <Button type="button" size="sm" variant="outline" onClick={addArea}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">A imobiliária pode atender várias cidades/estados.</p>
              {form.service_areas.map((area, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-end border rounded-md p-2 bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-xs">UF</Label>
                    <Select
                      value={area.state}
                      onValueChange={(v) => {
                        updateArea(idx, { state: v, city: '' });
                        fetchCitiesFor(idx, v);
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s.sigla} value={s.sigla}>{s.sigla}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cidade</Label>
                    <Select
                      value={area.city}
                      onValueChange={(v) => updateArea(idx, { city: v })}
                      disabled={!area.state}
                    >
                      <SelectTrigger><SelectValue placeholder={area.state ? 'Selecione' : 'Escolha a UF'} /></SelectTrigger>
                      <SelectContent>
                        {(areaCities[idx] || []).map((c) => (
                          <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeArea(idx)}
                    disabled={form.service_areas.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Logo da imobiliária</Label>
              <p className="text-xs text-muted-foreground">Tamanho ideal: 200×200px (quadrado, fundo transparente).</p>
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
                        const url = await uploadImage(file, 'logo');
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
              {uploadingLogo && <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Enviando…</p>}
            </div>

            <div className="space-y-2">
              <Label>Banner</Label>
              <p className="text-xs text-muted-foreground">Tamanho ideal: 1200×300px (proporção 4:1).</p>
              <div className="space-y-2">
                {form.banner_url && (
                  <img src={form.banner_url} alt="Banner" className="w-full aspect-[4/1] object-cover rounded-md border bg-muted" />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingBanner}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingBanner(true);
                    try {
                      const url = await uploadImage(file, 'banner');
                      setForm((f) => ({ ...f, banner_url: url }));
                    } catch (err: any) {
                      toast({ title: 'Erro ao enviar banner', description: err.message, variant: 'destructive' });
                    } finally {
                      setUploadingBanner(false);
                      e.target.value = '';
                    }
                  }}
                />
                <Input
                  placeholder="ou cole uma URL"
                  value={form.banner_url}
                  onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                />
              </div>
              {uploadingBanner && <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Enviando…</p>}
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <Label className="text-sm">Percentuais / Comissão — Indicação de Locatário</Label>
              <Input
                placeholder="Ex.: 50% sobre 1ª locação"
                value={form.commission_tenant_text}
                onChange={(e) => setForm({ ...form, commission_tenant_text: e.target.value })}
              />
              <div className="space-y-1">
                <Label className="text-xs">Quando ocorre</Label>
                <Select
                  value={form.commission_tenant_when}
                  onValueChange={(v) => setForm({ ...form, commission_tenant_when: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST_PAYMENT">No 1º Pagamento</SelectItem>
                    <SelectItem value="RECURRING">Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <Label className="text-sm">Percentuais / Comissão — Indicação de Proprietário</Label>
              <Input
                placeholder="Ex.: 30% sobre 1ª locação"
                value={form.commission_owner_text}
                onChange={(e) => setForm({ ...form, commission_owner_text: e.target.value })}
              />
              <div className="space-y-1">
                <Label className="text-xs">Quando ocorre</Label>
                <Select
                  value={form.commission_owner_when}
                  onValueChange={(v) => setForm({ ...form, commission_owner_when: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST_PAYMENT">No 1º Pagamento</SelectItem>
                    <SelectItem value="RECURRING">Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imobiliária dona (vincular a um usuário cadastrado) *</Label>
              {form.owner_user_id ? (
                <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{form.owner_name || '(sem nome)'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate pl-6">{form.owner_email}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setForm({ ...form, owner_user_id: '', owner_email: '', owner_name: '' })}
                  >
                    <X className="h-4 w-4 mr-1" /> Trocar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Buscar por e-mail ou nome…"
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                    />
                  </div>
                  {ownerSearch.trim().length >= 2 && (
                    <div className="border rounded-md max-h-48 overflow-auto divide-y">
                      {searchingOwner ? (
                        <div className="p-3 text-xs text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" /> Buscando…
                        </div>
                      ) : ownerResults.length === 0 ? (
                        <div className="p-3 text-xs text-muted-foreground">Nenhum usuário encontrado.</div>
                      ) : (
                        ownerResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className="w-full text-left p-2 hover:bg-muted/60 transition-colors"
                            onClick={() => {
                              setForm({
                                ...form,
                                owner_user_id: u.id,
                                owner_email: u.email || '',
                                owner_name: u.name || '',
                              });
                              setOwnerSearch('');
                              setOwnerResults([]);
                            }}
                          >
                            <div className="text-sm font-medium truncate">{u.name || '(sem nome)'}</div>
                            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Sem vínculo a um usuário cadastrado a parceira não pode ser publicada.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 rounded-md border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Publicada</Label>
                <p className="text-xs text-muted-foreground">
                  {form.owner_user_id
                    ? 'Aparece na página /alugue-em-parceria quando ativada.'
                    : 'Selecione a imobiliária dona para liberar a publicação.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {form.is_active && form.owner_user_id ? (
                  <Badge variant="default">Publicada</Badge>
                ) : (
                  <Badge variant="secondary">Rascunho</Badge>
                )}
                <Switch
                  checked={form.is_active}
                  disabled={!form.owner_user_id}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
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
