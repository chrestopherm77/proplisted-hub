import { useEffect, useMemo, useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ExternalLink, Copy, Loader2, Eye, X, ChevronsUpDown } from 'lucide-react';
import { PORTAL_TEMPLATES, getTemplateName } from '@/lib/portalTemplatesCatalog';
import { ImageUploadField } from '@/components/admin/shared/ImageUploadField';

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
  branding: {
    logo_url: '', about: '', whatsapp: '', phone: '', email: '',
    instagram: '', facebook: '', tiktok: '', youtube: '', linkedin: '',
    address: '', primary_color: '#1c1c1c', accent_color: '#c9a44c', bg_color: '#1c1c1c',
    hero_bg_url: '', hero_title: '', hero_subtitle: '',
    cnpj: '', creci: '', about_image_url: '', about_text: '', footer_text: '',
    menu_labels: { home: 'Início', sobre: 'Sobre', contato: 'Contato', financie: 'Financie', negociar: 'Negocie seu Imóvel' },
  },
  seo: { title: '', description: '', favicon_url: '' },
});

export function BrokerPortalsManagement() {
  const [items, setItems] = useState<Portal[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Portal> | null>(null);
  const [toDelete, setToDelete] = useState<Portal | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cityCount, setCityCount] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('broker_portals').select('*').order('created_at', { ascending: false });
    setItems((data as Portal[]) ?? []);
    setLoading(false);
  };

  const loadProfiles = async () => {
    if (allProfiles.length > 0) return;
    const { data } = await supabase.from('profiles').select('id, name, email').order('name', { ascending: true }).limit(2000);
    setAllProfiles((data as ProfileLite[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  // Contador de imóveis quando fonte=CITY
  useEffect(() => {
    if (!editing || editing.properties_source !== 'CITY' || !editing.city) {
      setCityCount(null);
      return;
    }
    const t = setTimeout(async () => {
      let q = supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('city', editing.city);
      if (editing.state) q = q.eq('state', editing.state);
      const { count } = await q;
      setCityCount(count ?? 0);
    }, 400);
    return () => clearTimeout(t);
  }, [editing?.properties_source, editing?.city, editing?.state]);

  const selectedProfile = useMemo(
    () => allProfiles.find((p) => p.id === editing?.user_id) || null,
    [allProfiles, editing?.user_id]
  );

  const openEditor = async (p?: Portal) => {
    await loadProfiles();
    setEditing(p ?? emptyForm());
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.user_id || !editing.slug) {
      toast.error('Selecione o corretor e informe um slug');
      return;
    }
    if (editing.properties_source === 'CITY' && !editing.city) {
      toast.error('Informe a cidade quando a fonte for "Todos da plataforma"');
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
    if (error) { toast.error('Erro: ' + error.message); return; }
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

  const updateBranding = (k: string, v: any) =>
    setEditing((e) => e && { ...e, branding: { ...(e.branding ?? {}), [k]: v } });
  const updateMenuLabel = (k: string, v: string) =>
    setEditing((e) => e && { ...e, branding: { ...(e.branding ?? {}), menu_labels: { ...((e.branding ?? {}).menu_labels ?? {}), [k]: v } } });
  const updateSeo = (k: string, v: string) =>
    setEditing((e) => e && { ...e, seo: { ...(e.seo ?? {}), [k]: v } });

  const getMenuItems = (): Array<{ id: string; label: string; visible: boolean; mode: 'section' | 'url'; target: string }> => {
    const b = editing?.branding ?? {};
    if (Array.isArray(b.menu_items) && b.menu_items.length) {
      return b.menu_items.map((it: any, i: number) => ({
        id: it.id ?? `item-${i}`,
        label: it.label ?? '',
        visible: it.visible !== false,
        mode: it.mode === 'url' ? 'url' : 'section',
        target: it.target ?? it.id ?? 'home',
      }));
    }
    const labels = b.menu_labels ?? {};
    const def: Record<string,string> = { home: 'Início', sobre: 'Sobre', contato: 'Contato', financie: 'Financie', negociar: 'Negocie seu Imóvel' };
    return ['home','sobre','contato','financie','negociar'].map((id) => ({
      id, label: labels[id] || def[id], visible: true, mode: 'section', target: id,
    }));
  };
  const setMenuItems = (items: any[]) =>
    setEditing((e) => e && { ...e, branding: { ...(e.branding ?? {}), menu_items: items } });
  const updateMenuItem = (idx: number, patch: Record<string, any>) => {
    const items = getMenuItems();
    items[idx] = { ...items[idx], ...patch };
    setMenuItems(items);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Portais de Imóveis</h2>
          <p className="text-sm text-muted-foreground">Sites individuais para corretores. Apenas admin ativa/desativa.</p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4" /> Novo portal
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Modelos disponíveis</h3>
          <span className="text-xs text-muted-foreground">Visualize e compartilhe um exemplo do modelo</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PORTAL_TEMPLATES.map((t) => {
            const previewUrl = `${window.location.origin}/portal-modelo/${t.id}`;
            return (
              <div key={t.id} className="border rounded-md p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t.name}</h4>
                  <Badge variant={t.available ? 'default' : 'secondary'}>{t.available ? 'Disponível' : 'Em breve'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground flex-1">{t.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" disabled={!t.available} asChild={t.available}>
                    {t.available ? (
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-3.5 w-3.5" /> Ver modelo
                      </a>
                    ) : (
                      <span><Eye className="h-3.5 w-3.5" /> Ver modelo</span>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" disabled={!t.available} onClick={() => { navigator.clipboard.writeText(previewUrl); toast.success('Link copiado para enviar'); }}>
                    <Copy className="h-3.5 w-3.5" /> Copiar link
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

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
                  <Badge variant="outline">{getTemplateName(p.template_id)}</Badge>
                  <Badge variant={p.properties_source === 'OWN' ? 'secondary' : 'default'}>
                    {p.properties_source === 'OWN' ? 'Imóveis do corretor' : `Todos da cidade: ${p.city ?? '-'}${p.state ? '/' + p.state : ''}`}
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
                <Button variant="outline" size="sm" onClick={() => openEditor(p)}>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar portal' : 'Novo portal'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="marca">Marca</TabsTrigger>
                <TabsTrigger value="hero">Hero</TabsTrigger>
                <TabsTrigger value="sobre">Sobre</TabsTrigger>
                <TabsTrigger value="contato">Contato/Redes</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="avancado">Avançado</TabsTrigger>
              </TabsList>

              {/* GERAL */}
              <TabsContent value="geral" className="space-y-4">
                <div>
                  <Label>Corretor cadastrado</Label>
                  <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {selectedProfile
                          ? <span className="truncate">{selectedProfile.name} <span className="text-muted-foreground">{selectedProfile.email}</span></span>
                          : <span className="text-muted-foreground">Buscar corretor por nome ou email...</span>}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                      <Command>
                        <CommandInput placeholder="Buscar..." />
                        <CommandList>
                          <CommandEmpty>Nenhum corretor encontrado.</CommandEmpty>
                          <CommandGroup>
                            {allProfiles.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={`${p.name} ${p.email}`}
                                onSelect={() => { setEditing({ ...editing, user_id: p.id }); setPickerOpen(false); }}
                              >
                                <div className="flex flex-col">
                                  <span>{p.name}</span>
                                  <span className="text-xs text-muted-foreground">{p.email}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedProfile && (
                    <button type="button" onClick={() => setEditing({ ...editing, user_id: '' })} className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1 hover:text-foreground">
                      <X className="h-3 w-3" /> Remover seleção
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Modelo (Template)</Label>
                    <Select value={String(editing.template_id ?? 1)} onValueChange={(v) => setEditing({ ...editing, template_id: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PORTAL_TEMPLATES.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)} disabled={!t.available}>{t.name}{!t.available ? ' (em breve)' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <Switch checked={editing.is_active ?? false} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                    <Label>Portal ativo</Label>
                  </div>
                  <div>
                    <Label>Slug (ex: imoveis-joao)</Label>
                    <Input value={editing.slug ?? ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
                  </div>
                  <div>
                    <Label>Domínio personalizado (opcional)</Label>
                    <Input value={editing.custom_domain ?? ''} onChange={(e) => setEditing({ ...editing, custom_domain: e.target.value })} placeholder="imoveisjoao.com.br" />
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-muted/30 space-y-3">
                  <div>
                    <Label className="text-base font-semibold">Quais imóveis aparecem no portal?</Label>
                    <p className="text-xs text-muted-foreground">Defina a fonte dos imóveis exibidos. Esta é a principal regra do portal.</p>
                  </div>
                  <Select value={editing.properties_source ?? 'OWN'} onValueChange={(v: 'OWN' | 'CITY') => setEditing({ ...editing, properties_source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWN">Apenas os imóveis publicados pelo corretor</SelectItem>
                      <SelectItem value="CITY">Todos os imóveis da plataforma (filtrar por cidade)</SelectItem>
                    </SelectContent>
                  </Select>
                  {editing.properties_source === 'CITY' && (
                    <>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label>Cidade *</Label>
                          <Input value={editing.city ?? ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
                        </div>
                        <div>
                          <Label>UF</Label>
                          <Input maxLength={2} value={editing.state ?? ''} onChange={(e) => setEditing({ ...editing, state: e.target.value.toUpperCase() })} />
                        </div>
                      </div>
                      {cityCount !== null && (
                        <p className="text-xs text-muted-foreground">
                          {cityCount} imóvel(is) ativo(s) encontrado(s){editing.city ? ` em ${editing.city}${editing.state ? '/' + editing.state : ''}` : ''}.
                        </p>
                      )}
                    </>
                  )}
                  {editing.properties_source === 'OWN' && (
                    <p className="text-xs text-muted-foreground">Apenas os imóveis cadastrados pelo corretor selecionado serão exibidos.</p>
                  )}
                </div>
              </TabsContent>

              {/* MARCA */}
              <TabsContent value="marca" className="space-y-4">
                <ImageUploadField label="Logo" value={editing.branding?.logo_url ?? ''} onChange={(v) => updateBranding('logo_url', v)} folder="portals/logos" />
                <div className="grid md:grid-cols-4 gap-3">
                  <div><Label>Cor primária (header/footer)</Label><Input type="color" value={editing.branding?.primary_color ?? '#1c1c1c'} onChange={(e) => updateBranding('primary_color', e.target.value)} /></div>
                  <div><Label>Cor de destaque (botões)</Label><Input type="color" value={editing.branding?.accent_color ?? '#c9a44c'} onChange={(e) => updateBranding('accent_color', e.target.value)} /></div>
                  <div><Label>Cor de preço/CTA forte</Label><Input type="color" value={editing.branding?.accent_color_strong ?? '#b91c1c'} onChange={(e) => updateBranding('accent_color_strong', e.target.value)} /></div>
                  <div><Label>Cor de fundo</Label><Input type="color" value={editing.branding?.bg_color ?? '#1c1c1c'} onChange={(e) => updateBranding('bg_color', e.target.value)} /></div>
                </div>
              </TabsContent>

              {/* HERO */}
              <TabsContent value="hero" className="space-y-4">
                <ImageUploadField label="Imagem de fundo do hero" value={editing.branding?.hero_bg_url ?? ''} onChange={(v) => updateBranding('hero_bg_url', v)} folder="portals/hero" />
                <div><Label>Título do hero</Label><Input value={editing.branding?.hero_title ?? ''} onChange={(e) => updateBranding('hero_title', e.target.value)} /></div>
                <div><Label>Subtítulo do hero</Label><Input value={editing.branding?.hero_subtitle ?? ''} onChange={(e) => updateBranding('hero_subtitle', e.target.value)} /></div>
              </TabsContent>

              {/* SOBRE */}
              <TabsContent value="sobre" className="space-y-4">
                <ImageUploadField label="Imagem da seção Sobre" value={editing.branding?.about_image_url ?? ''} onChange={(v) => updateBranding('about_image_url', v)} folder="portals/about" />
                <div><Label>Texto da seção Sobre</Label><Textarea rows={6} value={editing.branding?.about_text ?? ''} onChange={(e) => updateBranding('about_text', e.target.value)} /></div>
                <div><Label>Texto adicional (rodapé/breve)</Label><Textarea rows={3} value={editing.branding?.about ?? ''} onChange={(e) => updateBranding('about', e.target.value)} /></div>

                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Banner CTA (Modelo 2)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Banner exibido entre depoimentos e rodapé.</p>
                  <ImageUploadField label="Imagem do banner CTA" value={editing.branding?.cta_banner_url ?? ''} onChange={(v) => updateBranding('cta_banner_url', v)} folder="portals/cta" />
                  <div className="mt-2"><Label>Texto do banner CTA</Label><Input value={editing.branding?.cta_banner_text ?? ''} onChange={(e) => updateBranding('cta_banner_text', e.target.value)} placeholder="Não encontrou o que procurava?" /></div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Label className="text-base font-semibold">Depoimentos</Label>
                      <p className="text-xs text-muted-foreground">Aparecem na seção de depoimentos do portal.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      const list = Array.isArray(editing.branding?.testimonials) ? [...editing.branding.testimonials] : [];
                      list.push({ name: '', text: '' });
                      updateBranding('testimonials', list);
                    }}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                  </div>
                  <div className="space-y-3">
                    {(Array.isArray(editing.branding?.testimonials) ? editing.branding.testimonials : []).map((t: any, idx: number) => (
                      <div key={idx} className="border rounded-md p-3 space-y-2 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Input placeholder="Nome" value={t.name ?? ''} onChange={(e) => {
                            const list = [...editing.branding.testimonials];
                            list[idx] = { ...list[idx], name: e.target.value };
                            updateBranding('testimonials', list);
                          }} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => {
                            const list = [...editing.branding.testimonials];
                            list.splice(idx, 1);
                            updateBranding('testimonials', list);
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <Textarea rows={3} placeholder="Depoimento" value={t.text ?? ''} onChange={(e) => {
                          const list = [...editing.branding.testimonials];
                          list[idx] = { ...list[idx], text: e.target.value };
                          updateBranding('testimonials', list);
                        }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Label className="text-base font-semibold">Comprar ou Construir (Modelo 3)</Label>
                      <p className="text-xs text-muted-foreground">Até 3 cartões exibidos na seção "Comprar casa pronta ou construir".</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" disabled={(editing.branding?.build_or_buy?.length ?? 0) >= 3} onClick={() => {
                      const list = Array.isArray(editing.branding?.build_or_buy) ? [...editing.branding.build_or_buy] : [];
                      list.push({ image_url: '', title: '', description: '', link: '' });
                      updateBranding('build_or_buy', list);
                    }}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                  </div>
                  <div className="space-y-3">
                    {(Array.isArray(editing.branding?.build_or_buy) ? editing.branding.build_or_buy : []).map((it: any, idx: number) => (
                      <div key={idx} className="border rounded-md p-3 space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">Cartão {idx + 1}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => {
                            const list = [...editing.branding.build_or_buy];
                            list.splice(idx, 1);
                            updateBranding('build_or_buy', list);
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <ImageUploadField label="Imagem" value={it.image_url ?? ''} onChange={(v) => {
                          const list = [...editing.branding.build_or_buy];
                          list[idx] = { ...list[idx], image_url: v };
                          updateBranding('build_or_buy', list);
                        }} folder="portals/build-or-buy" />
                        <Input placeholder="Título" value={it.title ?? ''} onChange={(e) => {
                          const list = [...editing.branding.build_or_buy];
                          list[idx] = { ...list[idx], title: e.target.value };
                          updateBranding('build_or_buy', list);
                        }} />
                        <Textarea rows={2} placeholder="Descrição" value={it.description ?? ''} onChange={(e) => {
                          const list = [...editing.branding.build_or_buy];
                          list[idx] = { ...list[idx], description: e.target.value };
                          updateBranding('build_or_buy', list);
                        }} />
                        <Input placeholder="Link (opcional)" value={it.link ?? ''} onChange={(e) => {
                          const list = [...editing.branding.build_or_buy];
                          list[idx] = { ...list[idx], link: e.target.value };
                          updateBranding('build_or_buy', list);
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>


              {/* CONTATO */}
              <TabsContent value="contato" className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div><Label>WhatsApp</Label><Input value={editing.branding?.whatsapp ?? ''} onChange={(e) => updateBranding('whatsapp', e.target.value)} /></div>
                  <div><Label>Telefone</Label><Input value={editing.branding?.phone ?? ''} onChange={(e) => updateBranding('phone', e.target.value)} /></div>
                  <div><Label>Email</Label><Input value={editing.branding?.email ?? ''} onChange={(e) => updateBranding('email', e.target.value)} /></div>
                  <div><Label>Endereço</Label><Input value={editing.branding?.address ?? ''} onChange={(e) => updateBranding('address', e.target.value)} /></div>
                  <div><Label>CNPJ</Label><Input value={editing.branding?.cnpj ?? ''} onChange={(e) => updateBranding('cnpj', e.target.value)} /></div>
                  <div><Label>CRECI</Label><Input value={editing.branding?.creci ?? ''} onChange={(e) => updateBranding('creci', e.target.value)} /></div>
                  <div><Label>Instagram (URL)</Label><Input value={editing.branding?.instagram ?? ''} onChange={(e) => updateBranding('instagram', e.target.value)} /></div>
                  <div><Label>Facebook (URL)</Label><Input value={editing.branding?.facebook ?? ''} onChange={(e) => updateBranding('facebook', e.target.value)} /></div>
                  <div><Label>TikTok (URL)</Label><Input value={editing.branding?.tiktok ?? ''} onChange={(e) => updateBranding('tiktok', e.target.value)} /></div>
                  <div><Label>YouTube (URL)</Label><Input value={editing.branding?.youtube ?? ''} onChange={(e) => updateBranding('youtube', e.target.value)} /></div>
                  <div><Label>LinkedIn (URL)</Label><Input value={editing.branding?.linkedin ?? ''} onChange={(e) => updateBranding('linkedin', e.target.value)} /></div>
                </div>
              </TabsContent>

              {/* SEO */}
              <TabsContent value="seo" className="space-y-3">
                <div><Label>Título da página (SEO)</Label><Input value={editing.seo?.title ?? ''} onChange={(e) => updateSeo('title', e.target.value)} /></div>
                <div><Label>Descrição</Label><Textarea rows={3} value={editing.seo?.description ?? ''} onChange={(e) => updateSeo('description', e.target.value)} /></div>
                <ImageUploadField label="Favicon" value={editing.seo?.favicon_url ?? ''} onChange={(v) => updateSeo('favicon_url', v)} folder="portals/favicon" />
              </TabsContent>

              {/* AVANÇADO */}
              <TabsContent value="avancado" className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Itens do menu</Label>
                  <p className="text-xs text-muted-foreground mb-3">Defina rótulo, se aparece no menu e para onde leva (seção da página ou link externo).</p>
                  <div className="space-y-3">
                    {getMenuItems().map((it, idx) => (
                      <div key={it.id} className="border rounded-md p-3 space-y-2 bg-muted/30">
                        <div className="grid md:grid-cols-12 gap-2 items-end">
                          <div className="md:col-span-4">
                            <Label className="text-xs">Rótulo</Label>
                            <Input value={it.label} onChange={(e) => updateMenuItem(idx, { label: e.target.value })} />
                          </div>
                          <div className="md:col-span-3">
                            <Label className="text-xs">Destino</Label>
                            <Select value={it.mode} onValueChange={(v) => updateMenuItem(idx, { mode: v, target: v === 'section' ? (it.id || 'home') : '' })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="section">Seção da página</SelectItem>
                                <SelectItem value="url">Link externo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-4">
                            <Label className="text-xs">{it.mode === 'url' ? 'URL (https://...)' : 'Seção'}</Label>
                            {it.mode === 'url' ? (
                              <Input value={it.target} placeholder="https://..." onChange={(e) => updateMenuItem(idx, { target: e.target.value })} />
                            ) : (
                              <Select value={it.target} onValueChange={(v) => updateMenuItem(idx, { target: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="home">Início</SelectItem>
                                  <SelectItem value="sobre">Sobre</SelectItem>
                                  <SelectItem value="contato">Contato</SelectItem>
                                  <SelectItem value="financie">Financie</SelectItem>
                                  <SelectItem value="negociar">Negocie seu Imóvel</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div className="md:col-span-1 flex items-center gap-2 pb-2">
                            <Switch checked={it.visible} onCheckedChange={(v) => updateMenuItem(idx, { visible: v })} />
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{it.visible ? 'Visível no menu' : 'Oculto do menu'}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Texto do rodapé (copyright)</Label>
                  <Input value={editing.branding?.footer_text ?? ''} onChange={(e) => updateBranding('footer_text', e.target.value)} placeholder="© 2026 Minha Imobiliária" />
                </div>

                {editing.custom_domain && (
                  <div className="bg-muted p-3 rounded-md text-xs">
                    <strong>DNS:</strong> aponte o domínio <code>{editing.custom_domain}</code> para a Lovable conforme as instruções de domínio personalizado.
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
