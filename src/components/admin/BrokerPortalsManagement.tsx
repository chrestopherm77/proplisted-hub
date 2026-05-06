import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ExternalLink, Copy, Loader2 } from 'lucide-react';

type Portal = {
  id: string;
  user_id: string;
  slug: string;
  custom_domain: string | null;
  template_id: number;
  is_active: boolean;
  properties_source: 'OWN' | 'CITY';
  city: string | null;
  state: string | null;
  branding: Record<string, any>;
  seo: Record<string, any>;
  created_at: string;
};

type ProfileLite = { id: string; name: string; email: string | null };

const emptyForm = (): Partial<Portal> => ({
  user_id: '',
  slug: '',
  custom_domain: '',
  template_id: 1,
  is_active: false,
  properties_source: 'OWN',
  city: '',
  state: '',
  branding: { logo_url: '', about: '', whatsapp: '', phone: '', email: '', instagram: '', facebook: '', tiktok: '', youtube: '', linkedin: '', address: '', primary_color: '#1c1c1c', accent_color: '#c9a44c', bg_color: '#1c1c1c', hero_bg_url: '', hero_title: '', hero_subtitle: '', cnpj: '', creci: '', about_image_url: '', about_text: '', footer_text: '' },
  seo: { title: '', description: '', favicon_url: '' },
});

export function BrokerPortalsManagement() {
  const [items, setItems] = useState<Portal[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Portal> | null>(null);
  const [toDelete, setToDelete] = useState<Portal | null>(null);
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('broker_portals').select('*').order('created_at', { ascending: false });
    setItems((data as Portal[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!editing) return;
    if (!userSearch.trim()) { setProfiles([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email')
        .or(`name.ilike.%${userSearch}%,email.ilike.%${userSearch}%`)
        .limit(10);
      setProfiles((data as ProfileLite[]) ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch, editing]);

  const save = async () => {
    if (!editing) return;
    if (!editing.user_id || !editing.slug) {
      toast.error('Selecione o corretor e informe um slug');
      return;
    }
    setSaving(true);
    const payload: any = {
      user_id: editing.user_id,
      slug: editing.slug?.toLowerCase().trim(),
      custom_domain: editing.custom_domain?.trim().toLowerCase() || null,
      template_id: editing.template_id ?? 1,
      is_active: editing.is_active ?? false,
      properties_source: editing.properties_source ?? 'OWN',
      city: editing.city || null,
      state: editing.state || null,
      branding: editing.branding ?? {},
      seo: editing.seo ?? {},
    };
    const { error } = editing.id
      ? await supabase.from('broker_portals').update(payload).eq('id', editing.id)
      : await supabase.from('broker_portals').insert(payload);
    setSaving(false);
    if (error) {
      toast.error('Erro: ' + error.message);
      return;
    }
    toast.success('Portal salvo');
    setEditing(null);
    load();
  };

  const toggleActive = async (p: Portal) => {
    const { error } = await supabase.from('broker_portals').update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) toast.error('Erro ao atualizar');
    else { toast.success(p.is_active ? 'Desativado' : 'Ativado'); load(); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('broker_portals').delete().eq('id', toDelete.id);
    if (error) toast.error('Erro ao excluir');
    else { toast.success('Excluído'); load(); }
    setToDelete(null);
  };

  const updateBranding = (k: string, v: string) =>
    setEditing((e) => e && { ...e, branding: { ...(e.branding ?? {}), [k]: v } });
  const updateSeo = (k: string, v: string) =>
    setEditing((e) => e && { ...e, seo: { ...(e.seo ?? {}), [k]: v } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portais de Imóveis</h2>
          <p className="text-sm text-muted-foreground">Sites individuais para corretores. Apenas admin ativa/desativa.</p>
        </div>
        <Button onClick={() => setEditing(emptyForm())}>
          <Plus className="h-4 w-4" /> Novo portal
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Nenhum portal criado ainda.</Card>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">/{p.slug}</h3>
                  <Badge variant="outline">Template {p.template_id}</Badge>
                  <Badge variant={p.properties_source === 'OWN' ? 'secondary' : 'default'}>
                    {p.properties_source === 'OWN' ? 'Imóveis próprios' : `Cidade: ${p.city ?? '-'}`}
                  </Badge>
                  {p.is_active ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {p.custom_domain ? `🌐 ${p.custom_domain}` : 'Sem domínio personalizado'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1 rounded-md border">
                  <span className="text-xs">Ativar</span>
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                </div>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/portal/${p.slug}`); toast.success('Link copiado'); }}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/portal/${p.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setEditing(p); setUserSearch(''); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setToDelete(p)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar portal' : 'Novo portal'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Corretor (buscar nome ou email)</Label>
                  <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar..." />
                  {profiles.length > 0 && (
                    <div className="border rounded-md mt-1 max-h-40 overflow-y-auto">
                      {profiles.map((p) => (
                        <button key={p.id} type="button" className={`w-full text-left p-2 text-sm hover:bg-muted ${editing.user_id === p.id ? 'bg-muted' : ''}`}
                          onClick={() => { setEditing({ ...editing, user_id: p.id }); setUserSearch(`${p.name} (${p.email ?? ''})`); setProfiles([]); }}>
                          {p.name} <span className="text-muted-foreground">{p.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {editing.user_id && <p className="text-xs text-muted-foreground mt-1">ID: {editing.user_id}</p>}
                </div>
                <div>
                  <Label>Template</Label>
                  <Select value={String(editing.template_id ?? 1)} onValueChange={(v) => setEditing({ ...editing, template_id: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Template 1</SelectItem>
                      <SelectItem value="2">Template 2</SelectItem>
                      <SelectItem value="3">Template 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Slug (ex: imoveis-joao)</Label>
                  <Input value={editing.slug ?? ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
                </div>
                <div>
                  <Label>Domínio personalizado (opcional)</Label>
                  <Input value={editing.custom_domain ?? ''} onChange={(e) => setEditing({ ...editing, custom_domain: e.target.value })} placeholder="imoveisjoao.com.br" />
                </div>
                <div>
                  <Label>Fonte dos imóveis</Label>
                  <Select value={editing.properties_source ?? 'OWN'} onValueChange={(v: 'OWN' | 'CITY') => setEditing({ ...editing, properties_source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWN">Apenas imóveis do corretor</SelectItem>
                      <SelectItem value="CITY">Todos os imóveis da cidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Switch checked={editing.is_active ?? false} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <Label>Ativo</Label>
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={editing.city ?? ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input maxLength={2} value={editing.state ?? ''} onChange={(e) => setEditing({ ...editing, state: e.target.value.toUpperCase() })} />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Marca / Branding</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div><Label>Logo URL</Label><Input value={editing.branding?.logo_url ?? ''} onChange={(e) => updateBranding('logo_url', e.target.value)} /></div>
                  <div><Label>Cor primária</Label><Input value={editing.branding?.primary_color ?? ''} onChange={(e) => updateBranding('primary_color', e.target.value)} /></div>
                  <div><Label>WhatsApp</Label><Input value={editing.branding?.whatsapp ?? ''} onChange={(e) => updateBranding('whatsapp', e.target.value)} /></div>
                  <div><Label>Telefone</Label><Input value={editing.branding?.phone ?? ''} onChange={(e) => updateBranding('phone', e.target.value)} /></div>
                  <div><Label>Email</Label><Input value={editing.branding?.email ?? ''} onChange={(e) => updateBranding('email', e.target.value)} /></div>
                  <div><Label>Endereço</Label><Input value={editing.branding?.address ?? ''} onChange={(e) => updateBranding('address', e.target.value)} /></div>
                  <div><Label>Instagram</Label><Input value={editing.branding?.instagram ?? ''} onChange={(e) => updateBranding('instagram', e.target.value)} /></div>
                  <div><Label>Facebook</Label><Input value={editing.branding?.facebook ?? ''} onChange={(e) => updateBranding('facebook', e.target.value)} /></div>
                  <div><Label>TikTok</Label><Input value={editing.branding?.tiktok ?? ''} onChange={(e) => updateBranding('tiktok', e.target.value)} /></div>
                  <div><Label>YouTube</Label><Input value={editing.branding?.youtube ?? ''} onChange={(e) => updateBranding('youtube', e.target.value)} /></div>
                  <div><Label>LinkedIn</Label><Input value={editing.branding?.linkedin ?? ''} onChange={(e) => updateBranding('linkedin', e.target.value)} /></div>
                  <div className="md:col-span-2"><Label>Sobre</Label><Textarea rows={3} value={editing.branding?.about ?? ''} onChange={(e) => updateBranding('about', e.target.value)} /></div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">SEO</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div><Label>Título</Label><Input value={editing.seo?.title ?? ''} onChange={(e) => updateSeo('title', e.target.value)} /></div>
                  <div><Label>Favicon URL</Label><Input value={editing.seo?.favicon_url ?? ''} onChange={(e) => updateSeo('favicon_url', e.target.value)} /></div>
                  <div className="md:col-span-2"><Label>Descrição</Label><Textarea rows={2} value={editing.seo?.description ?? ''} onChange={(e) => updateSeo('description', e.target.value)} /></div>
                </div>
              </div>

              {editing.custom_domain && (
                <div className="bg-muted p-3 rounded-md text-xs">
                  <strong>DNS:</strong> aponte o domínio <code>{editing.custom_domain}</code> para a Lovable conforme as instruções de domínio personalizado.
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir portal?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
