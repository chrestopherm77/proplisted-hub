import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Search, X, CheckCircle2 } from 'lucide-react';

interface ProfileOption {
  id: string;
  email: string | null;
  name: string | null;
}

interface Partner {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  commission_text: string | null;
  whatsapp_phone: string;
  state: string;
  city: string;
  is_active: boolean;
  sort_order: number;
  owner_user_id: string | null;
}

const emptyForm = {
  id: '',
  name: '',
  slug: '',
  logo_url: '',
  description: '',
  commission_text: '',
  whatsapp_phone: '',
  state: '',
  city: '',
  is_active: false,
  sort_order: 0,
  owner_user_id: '' as string,
  owner_email: '',
  owner_name: '',
};

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export function RentalPartnersManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerResults, setOwnerResults] = useState<ProfileOption[]>([]);
  const [searchingOwner, setSearchingOwner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rental_partners')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    setItems((data as Partner[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ ...emptyForm });
    setOwnerSearch('');
    setOwnerResults([]);
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
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      logo_url: p.logo_url || '',
      description: p.description || '',
      commission_text: p.commission_text || '',
      whatsapp_phone: p.whatsapp_phone,
      state: p.state,
      city: p.city,
      is_active: p.is_active,
      sort_order: p.sort_order,
      owner_user_id: p.owner_user_id || '',
      owner_email,
      owner_name,
    });
    setOwnerSearch('');
    setOwnerResults([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.whatsapp_phone || !form.state || !form.city) {
      toast({ title: 'Preencha nome, WhatsApp, UF e cidade', variant: 'destructive' });
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
      const slug = form.slug?.trim() || slugify(form.name);
      const payload = {
        name: form.name.trim(),
        slug,
        logo_url: form.logo_url.trim() || null,
        description: form.description.trim() || null,
        commission_text: form.commission_text.trim() || null,
        whatsapp_phone: form.whatsapp_phone.replace(/\D/g, ''),
        state: form.state.trim().toUpperCase().slice(0, 2),
        city: form.city.trim(),
        is_active: form.is_active,
        sort_order: form.sort_order || 0,
        owner_user_id: form.owner_user_id,
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
                <TableHead>Cidade/UF</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead className="w-20">Ordem</TableHead>
                <TableHead className="w-20">Ativo</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma parceira cadastrada.</TableCell></TableRow>
              ) : items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.city}/{p.state}</TableCell>
                  <TableCell className="font-mono text-xs">{p.whatsapp_phone}</TableCell>
                  <TableCell className="text-xs">{p.commission_text || '—'}</TableCell>
                  <TableCell>{p.sort_order}</TableCell>
                  <TableCell><Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} /></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(p)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar parceira' : 'Nova parceira'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">

            <div className="space-y-2 col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} placeholder="auto" onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || '0', 10) })} />
            </div>
            <div className="space-y-2">
              <Label>UF *</Label>
              <Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>WhatsApp (com DDD) *</Label>
              <Input
                value={form.whatsapp_phone}
                placeholder="43996102805"
                onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Será salvo apenas com dígitos.</p>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Logo da imobiliária</Label>
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
                        const ext = file.name.split('.').pop() || 'png';
                        const path = `rental-partners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                        const { error: upErr } = await supabase.storage.from('brand-logos').upload(path, file, { upsert: true });
                        if (upErr) throw upErr;
                        const { data } = supabase.storage.from('brand-logos').getPublicUrl(path);
                        setForm((f) => ({ ...f, logo_url: data.publicUrl }));
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

            <div className="space-y-2 col-span-2">
              <Label>Descrição da modalidade</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Percentuais / Comissão (texto curto)</Label>
              <Input
                placeholder="Ex.: 50% sobre 1ª locação"
                value={form.commission_text}
                onChange={(e) => setForm({ ...form, commission_text: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
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
            <div className="flex items-center justify-between gap-2 col-span-2 rounded-md border p-3">
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
