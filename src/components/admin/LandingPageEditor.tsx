import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import {
  DEFAULT_THEME, mergeLPContent,
  type CustomLandingPage, type LPContent, type LPTheme, type LPPlan,
} from '@/components/admin/landing-page/types';
import { LandingPageRenderer } from '@/components/landing-page-renderer/LandingPageRenderer';
import { IconPicker } from '@/components/admin/shared/IconPicker';
import { normalizeSlug, validateSlug } from '@/lib/reservedSlugs';
import { useAuth } from '@/hooks/useAuth';

async function uploadFile(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('landing-pages').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    toast.error('Erro no upload: ' + error.message);
    return null;
  }
  const { data } = supabase.storage.from('landing-pages').getPublicUrl(path);
  return data.publicUrl;
}

export function LandingPageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [title, setTitle] = useState('Nova Landing Page');
  const [slug, setSlug] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [theme, setTheme] = useState<LPTheme>(DEFAULT_THEME);
  const [content, setContent] = useState<LPContent>(mergeLPContent(null));

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase
        .from('custom_landing_pages').select('*').eq('id', id!).maybeSingle();
      if (error || !data) {
        toast.error('LP não encontrada');
        navigate('/admin/landing-pages');
        return;
      }
      const lp = data as unknown as CustomLandingPage;
      setTitle(lp.title);
      setSlug(lp.slug);
      setIsPublished(lp.is_published);
      setTheme({ ...DEFAULT_THEME, ...lp.theme });
      setContent(mergeLPContent(lp.content));
      setLoading(false);
    })();
  }, [id, isNew, navigate]);

  const handleSave = async () => {
    const v = validateSlug(slug);
    if (!v.valid) { toast.error(v.error!); return; }
    if (!title.trim()) { toast.error('Título é obrigatório'); return; }

    setSaving(true);
    const payload = {
      slug: slug.toLowerCase().trim(),
      title: title.trim(),
      is_published: isPublished,
      theme: theme as unknown as Record<string, unknown>,
      content: content as unknown as Record<string, unknown>,
    };

    if (isNew) {
      const { data, error } = await supabase
        .from('custom_landing_pages')
        .insert({ ...payload, created_by: user?.id })
        .select('id')
        .single();
      setSaving(false);
      if (error) {
        toast.error(error.message.includes('duplicate') ? 'Slug já em uso' : error.message);
        return;
      }
      toast.success('LP criada!');
      navigate(`/admin/landing-pages/${data.id}`);
    } else {
      const { error } = await supabase
        .from('custom_landing_pages').update(payload).eq('id', id!);
      setSaving(false);
      if (error) {
        toast.error(error.message.includes('duplicate') ? 'Slug já em uso' : error.message);
        return;
      }
      toast.success('LP salva!');
    }
  };

  const updateContent = <K extends keyof LPContent>(key: K, value: LPContent[K]) => {
    setContent((c) => ({ ...c, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/landing-pages')}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <h2 className="text-xl font-bold">{isNew ? 'Nova LP' : 'Editar LP'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview((p) => !p)}>
            <Eye className="h-4 w-4" /> {showPreview ? 'Editor' : 'Preview'}
          </Button>
          {!isNew && slug && (
            <Button variant="outline" asChild>
              <a href={`/${slug}`} target="_blank" rel="noopener noreferrer">Abrir LP</a>
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      {showPreview ? (
        <Card className="overflow-hidden">
          <LandingPageRenderer theme={theme} content={content} />
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* ===== Editor ===== */}
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <div>
                <Label>Título interno</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Slug da URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(normalizeSlug(e.target.value))}
                    placeholder="conectae"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  URL final: <span className="font-mono">{window.location.origin}/{slug || 'seu-slug'}</span>
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Publicada</Label>
                <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
              </div>
            </Card>

            <Accordion type="multiple" defaultValue={['header', 'hero']} className="space-y-2">
              {/* HEADER */}
              <AccordionItem value="header" className="border rounded-md px-3">
                <AccordionTrigger>Cabeçalho</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div>
                    <Label>Nome da marca</Label>
                    <Input
                      value={content.header.brand_name}
                      onChange={(e) => updateContent('header', { ...content.header, brand_name: e.target.value })}
                    />
                  </div>
                  <ImageUploadField
                    label="Logo"
                    value={content.header.logo_url}
                    onChange={(url) => updateContent('header', { ...content.header, logo_url: url })}
                    folder="logos"
                  />
                  <div className="flex items-center justify-between">
                    <Label>Mostrar botão "Entrar"</Label>
                    <Switch
                      checked={content.header.show_login_button}
                      onCheckedChange={(v) => updateContent('header', { ...content.header, show_login_button: v })}
                    />
                  </div>
                  {content.header.show_login_button && (
                    <>
                      <div>
                        <Label>Texto do botão "Entrar"</Label>
                        <Input
                          value={content.header.login_label}
                          onChange={(e) => updateContent('header', { ...content.header, login_label: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Link do botão "Entrar" (opcional)</Label>
                        <Input
                          value={content.header.login_url}
                          placeholder="https://..."
                          onChange={(e) => updateContent('header', { ...content.header, login_url: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label>Texto do botão "Cadastre-se"</Label>
                    <Input
                      value={content.header.signup_label}
                      onChange={(e) => updateContent('header', { ...content.header, signup_label: e.target.value })}
                    />
                  </div>
                  <CtaModeFields
                    mode={content.header.signup_mode || 'link'}
                    url={content.header.signup_url}
                    onChange={(mode, url) =>
                      updateContent('header', { ...content.header, signup_mode: mode, signup_url: url })
                    }
                  />
                </AccordionContent>
              </AccordionItem>

              {/* HERO */}
              <AccordionItem value="hero" className="border rounded-md px-3">
                <AccordionTrigger>Hero (topo)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div>
                    <Label>Badge (texto pequeno acima do título)</Label>
                    <Input value={content.hero.badge_text}
                      onChange={(e) => updateContent('hero', { ...content.hero, badge_text: e.target.value })} />
                  </div>
                  <div>
                    <Label>Título — linha 1</Label>
                    <Input value={content.hero.title_line1}
                      onChange={(e) => updateContent('hero', { ...content.hero, title_line1: e.target.value })} />
                  </div>
                  <div>
                    <Label>Título — linha 2 (com destaque colorido)</Label>
                    <Input value={content.hero.title_line2}
                      onChange={(e) => updateContent('hero', { ...content.hero, title_line2: e.target.value })} />
                  </div>
                  <div>
                    <Label>Subtítulo</Label>
                    <Textarea value={content.hero.subtitle}
                      onChange={(e) => updateContent('hero', { ...content.hero, subtitle: e.target.value })} />
                  </div>
                  <div>
                    <Label>Texto do CTA primário</Label>
                    <Input value={content.hero.cta_primary_label}
                      onChange={(e) => updateContent('hero', { ...content.hero, cta_primary_label: e.target.value })} />
                  </div>
                  <CtaModeFields
                    mode={content.hero.cta_primary_mode || 'link'}
                    url={content.hero.cta_primary_url}
                    onChange={(mode, url) =>
                      updateContent('hero', { ...content.hero, cta_primary_mode: mode, cta_primary_url: url })
                    }
                  />
                  <div>
                    <Label>Texto do CTA secundário (opcional)</Label>
                    <Input value={content.hero.cta_secondary_label}
                      onChange={(e) => updateContent('hero', { ...content.hero, cta_secondary_label: e.target.value })} />
                  </div>
                  <div>
                    <Label>Tipo do CTA secundário</Label>
                    <Select
                      value={content.hero.cta_secondary_mode || 'scroll_plans'}
                      onValueChange={(v) => updateContent('hero', { ...content.hero, cta_secondary_mode: v as 'link' | 'form' | 'scroll_plans' })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scroll_plans">Rolar até a seção de Planos</SelectItem>
                        <SelectItem value="link">Link direto (URL)</SelectItem>
                        <SelectItem value="form">Abrir formulário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {content.hero.cta_secondary_mode === 'link' && (
                    <Input value={content.hero.cta_secondary_url} placeholder="https://..."
                      onChange={(e) => updateContent('hero', { ...content.hero, cta_secondary_url: e.target.value })} />
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* FUNCIONALIDADES */}
              <AccordionItem value="features" className="border rounded-md px-3">
                <AccordionTrigger>Funcionalidades ({content.features_section.items.length})</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <Input value={content.features_section.badge} placeholder="Badge"
                    onChange={(e) => updateContent('features_section', { ...content.features_section, badge: e.target.value })} />
                  <Input value={content.features_section.title} placeholder="Título"
                    onChange={(e) => updateContent('features_section', { ...content.features_section, title: e.target.value })} />
                  <Textarea value={content.features_section.subtitle} placeholder="Subtítulo"
                    onChange={(e) => updateContent('features_section', { ...content.features_section, subtitle: e.target.value })} />
                  {content.features_section.items.map((f, i) => (
                    <Card key={i} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Card {i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => {
                          const items = content.features_section.items.filter((_, idx) => idx !== i);
                          updateContent('features_section', { ...content.features_section, items });
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <IconPicker value={f.icon} onChange={(icon) => {
                        const items = [...content.features_section.items]; items[i] = { ...f, icon };
                        updateContent('features_section', { ...content.features_section, items });
                      }} />
                      <Input value={f.title} placeholder="Título"
                        onChange={(e) => {
                          const items = [...content.features_section.items]; items[i] = { ...f, title: e.target.value };
                          updateContent('features_section', { ...content.features_section, items });
                        }} />
                      <Textarea value={f.desc} placeholder="Descrição"
                        onChange={(e) => {
                          const items = [...content.features_section.items]; items[i] = { ...f, desc: e.target.value };
                          updateContent('features_section', { ...content.features_section, items });
                        }} />
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    const items = [...content.features_section.items, { icon: 'Star', title: 'Nova funcionalidade', desc: 'Descrição' }];
                    updateContent('features_section', { ...content.features_section, items });
                  }}><Plus className="h-3 w-3" /> Adicionar card</Button>
                </AccordionContent>
              </AccordionItem>

              {/* EXTRAS */}
              <AccordionItem value="extras" className="border rounded-md px-3">
                <AccordionTrigger>Cards Extras ({content.extras.length})</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {content.extras.map((ex, i) => (
                    <Card key={i} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Extra {i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => {
                          updateContent('extras', content.extras.filter((_, idx) => idx !== i));
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <IconPicker value={ex.icon} onChange={(icon) => {
                        const arr = [...content.extras]; arr[i] = { ...ex, icon };
                        updateContent('extras', arr);
                      }} />
                      <Input value={ex.title} placeholder="Título"
                        onChange={(e) => {
                          const arr = [...content.extras]; arr[i] = { ...ex, title: e.target.value };
                          updateContent('extras', arr);
                        }} />
                      <Textarea value={ex.desc} placeholder="Descrição"
                        onChange={(e) => {
                          const arr = [...content.extras]; arr[i] = { ...ex, desc: e.target.value };
                          updateContent('extras', arr);
                        }} />
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    updateContent('extras', [...content.extras, { icon: 'GraduationCap', title: 'Novo extra', desc: '' }]);
                  }}><Plus className="h-3 w-3" /> Adicionar extra</Button>
                </AccordionContent>
              </AccordionItem>

              {/* COMO FUNCIONA */}
              <AccordionItem value="hiw" className="border rounded-md px-3">
                <AccordionTrigger>Como Funciona ({content.how_it_works.steps.length} passos)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <Input value={content.how_it_works.title} placeholder="Título"
                    onChange={(e) => updateContent('how_it_works', { ...content.how_it_works, title: e.target.value })} />
                  <Input value={content.how_it_works.subtitle} placeholder="Subtítulo"
                    onChange={(e) => updateContent('how_it_works', { ...content.how_it_works, subtitle: e.target.value })} />
                  {content.how_it_works.steps.map((s, i) => (
                    <Card key={i} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Passo {i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => {
                          const steps = content.how_it_works.steps.filter((_, idx) => idx !== i);
                          updateContent('how_it_works', { ...content.how_it_works, steps });
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <Input value={s.title} placeholder="Título"
                        onChange={(e) => {
                          const steps = [...content.how_it_works.steps]; steps[i] = { ...s, title: e.target.value };
                          updateContent('how_it_works', { ...content.how_it_works, steps });
                        }} />
                      <Textarea value={s.desc} placeholder="Descrição"
                        onChange={(e) => {
                          const steps = [...content.how_it_works.steps]; steps[i] = { ...s, desc: e.target.value };
                          updateContent('how_it_works', { ...content.how_it_works, steps });
                        }} />
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    updateContent('how_it_works', { ...content.how_it_works, steps: [...content.how_it_works.steps, { title: 'Novo passo', desc: '' }] });
                  }}><Plus className="h-3 w-3" /> Adicionar passo</Button>
                </AccordionContent>
              </AccordionItem>

              {/* STATS */}
              <AccordionItem value="stats" className="border rounded-md px-3">
                <AccordionTrigger>Estatísticas ({content.stats.items.length})</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {content.stats.items.map((st, i) => (
                    <Card key={i} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Stat {i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => {
                          const items = content.stats.items.filter((_, idx) => idx !== i);
                          updateContent('stats', { items });
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <IconPicker value={st.icon} onChange={(icon) => {
                        const items = [...content.stats.items]; items[i] = { ...st, icon };
                        updateContent('stats', { items });
                      }} />
                      <Input value={st.value} placeholder="Valor (ex: 500+)"
                        onChange={(e) => {
                          const items = [...content.stats.items]; items[i] = { ...st, value: e.target.value };
                          updateContent('stats', { items });
                        }} />
                      <Input value={st.label} placeholder="Label"
                        onChange={(e) => {
                          const items = [...content.stats.items]; items[i] = { ...st, label: e.target.value };
                          updateContent('stats', { items });
                        }} />
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    updateContent('stats', { items: [...content.stats.items, { icon: 'Star', value: '0', label: 'Label' }] });
                  }}><Plus className="h-3 w-3" /> Adicionar stat</Button>
                </AccordionContent>
              </AccordionItem>

              {/* PLANOS */}
              <AccordionItem value="plans" className="border rounded-md px-3">
                <AccordionTrigger>Planos ({content.plans_section.plans.length})</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <Input value={content.plans_section.badge} placeholder="Badge"
                    onChange={(e) => updateContent('plans_section', { ...content.plans_section, badge: e.target.value })} />
                  <Input value={content.plans_section.title} placeholder="Título"
                    onChange={(e) => updateContent('plans_section', { ...content.plans_section, title: e.target.value })} />
                  <Textarea value={content.plans_section.subtitle} placeholder="Subtítulo"
                    onChange={(e) => updateContent('plans_section', { ...content.plans_section, subtitle: e.target.value })} />
                  {content.plans_section.plans.map((p, i) => (
                    <Card key={i} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Plano {i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => {
                          const plans = content.plans_section.plans.filter((_, idx) => idx !== i);
                          updateContent('plans_section', { ...content.plans_section, plans });
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <Input value={p.name} placeholder="Nome do plano"
                        onChange={(e) => updatePlan(i, { ...p, name: e.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={p.price} placeholder="Preço (ex: R$ 39,90)"
                          onChange={(e) => updatePlan(i, { ...p, price: e.target.value })} />
                        <Input value={p.priceSuffix} placeholder="Sufixo (ex: /mês)"
                          onChange={(e) => updatePlan(i, { ...p, priceSuffix: e.target.value })} />
                      </div>
                      <Input value={p.credits} placeholder="Texto de créditos"
                        onChange={(e) => updatePlan(i, { ...p, credits: e.target.value })} />
                      <div>
                        <Label className="text-xs">Destaque visual</Label>
                        <Select
                          value={p.highlight || 'none'}
                          onValueChange={(v) => updatePlan(i, { ...p, highlight: v === 'none' ? null : v as 'popular' | 'premium' })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            <SelectItem value="popular">Mais Popular (borda primária)</SelectItem>
                            <SelectItem value="premium">Premium (borda escura)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Features (uma por linha)</Label>
                        <Textarea
                          rows={5}
                          value={p.features.join('\n')}
                          onChange={(e) => updatePlan(i, { ...p, features: e.target.value.split('\n') })}
                        />
                      </div>
                      <Input value={p.cta_label} placeholder="Texto do botão"
                        onChange={(e) => updatePlan(i, { ...p, cta_label: e.target.value })} />
                      <CtaModeFields
                        mode={p.cta_mode || 'link'}
                        url={p.cta_url || ''}
                        onChange={(mode, url) => updatePlan(i, { ...p, cta_mode: mode, cta_url: url })}
                      />
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    const plans = [...content.plans_section.plans, {
                      name: 'Novo plano', price: 'R$ 0', priceSuffix: '/mês',
                      credits: '', cta_label: 'Assinar', cta_mode: 'link' as const, cta_url: '',
                      features: ['Feature 1'],
                    }];
                    updateContent('plans_section', { ...content.plans_section, plans });
                  }}><Plus className="h-3 w-3" /> Adicionar plano</Button>
                  <Input value={content.plans_section.footer_note} placeholder="Nota de rodapé"
                    onChange={(e) => updateContent('plans_section', { ...content.plans_section, footer_note: e.target.value })} />
                </AccordionContent>
              </AccordionItem>

              {/* CTA FINAL */}
              <AccordionItem value="final_cta" className="border rounded-md px-3">
                <AccordionTrigger>CTA Final</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <Input placeholder="Título" value={content.final_cta.title}
                    onChange={(e) => updateContent('final_cta', { ...content.final_cta, title: e.target.value })} />
                  <Textarea placeholder="Subtítulo" value={content.final_cta.subtitle}
                    onChange={(e) => updateContent('final_cta', { ...content.final_cta, subtitle: e.target.value })} />
                  <Input placeholder="Texto do botão" value={content.final_cta.cta_label}
                    onChange={(e) => updateContent('final_cta', { ...content.final_cta, cta_label: e.target.value })} />
                  <CtaModeFields
                    mode={content.final_cta.cta_mode || 'link'}
                    url={content.final_cta.cta_url}
                    onChange={(mode, url) =>
                      updateContent('final_cta', { ...content.final_cta, cta_mode: mode, cta_url: url })
                    }
                  />
                  <Input placeholder="Texto secundário (link discreto)" value={content.final_cta.secondary_text}
                    onChange={(e) => updateContent('final_cta', { ...content.final_cta, secondary_text: e.target.value })} />
                  <Input placeholder="URL do texto secundário (opcional)" value={content.final_cta.secondary_url}
                    onChange={(e) => updateContent('final_cta', { ...content.final_cta, secondary_url: e.target.value })} />
                </AccordionContent>
              </AccordionItem>

              {/* FORMULÁRIO DE CADASTRO */}
              <AccordionItem value="cta_form" className="border rounded-md px-3">
                <AccordionTrigger>Formulário de Cadastro</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Aberto quando qualquer botão CTA estiver no modo "Formulário".
                  </p>
                  <div>
                    <Label>Mensagem no topo (opcional)</Label>
                    <Input
                      value={content.cta_form?.intro_text || ''}
                      onChange={(e) => updateContent('cta_form', { ...content.cta_form!, intro_text: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Texto do botão de envio</Label>
                    <Input
                      value={content.cta_form?.submit_label || ''}
                      onChange={(e) => updateContent('cta_form', { ...content.cta_form!, submit_label: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Redirecionar após cadastro (opcional)</Label>
                    <Input
                      value={content.cta_form?.redirect_url || ''}
                      placeholder="https://..."
                      onChange={(e) => updateContent('cta_form', { ...content.cta_form!, redirect_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Campos do formulário</Label>
                    {(content.cta_form?.fields || []).map((f, i) => {
                      const fields = content.cta_form!.fields;
                      const update = (patch: Partial<typeof f>) => {
                        const arr = [...fields]; arr[i] = { ...f, ...patch };
                        updateContent('cta_form', { ...content.cta_form!, fields: arr });
                      };
                      return (
                        <Card key={f.id} className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">Campo {i + 1}</span>
                            <Button variant="ghost" size="sm" onClick={() => {
                              const arr = fields.filter((_, idx) => idx !== i);
                              updateContent('cta_form', { ...content.cta_form!, fields: arr });
                            }}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                          <Input value={f.label} placeholder="Rótulo (ex: Nome)"
                            onChange={(e) => update({ label: e.target.value })} />
                          <div className="flex gap-2 items-center">
                            <Select value={f.type} onValueChange={(v) => update({ type: v as 'text'|'email'|'phone' })}>
                              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="phone">Telefone</SelectItem>
                                <SelectItem value="email">E-mail</SelectItem>
                              </SelectContent>
                            </Select>
                            <label className="flex items-center gap-2 text-xs whitespace-nowrap">
                              <Switch checked={f.required} onCheckedChange={(v) => update({ required: v })} />
                              Obrigatório
                            </label>
                          </div>
                        </Card>
                      );
                    })}
                    <Button variant="outline" size="sm" onClick={() => {
                      const newField = {
                        id: `f_${Date.now().toString(36)}`,
                        label: 'Novo campo',
                        type: 'text' as const,
                        required: false,
                      };
                      updateContent('cta_form', {
                        ...content.cta_form!,
                        fields: [...(content.cta_form?.fields || []), newField],
                      });
                    }}>
                      <Plus className="h-3 w-3" /> Adicionar campo
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* FLOATING CTA */}
              <AccordionItem value="floating" className="border rounded-md px-3">
                <AccordionTrigger>Botão flutuante</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <Card className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Botão flutuante</span>
                      <label className="flex items-center gap-2 text-xs">
                        Ativado
                        <Switch
                          checked={!!content.floating_cta?.enabled}
                          onCheckedChange={(v) => updateContent('floating_cta', { ...(content.floating_cta || { label: '', mode: 'link', url: '' }), enabled: v })}
                        />
                      </label>
                    </div>
                    <Input
                      value={content.floating_cta?.label || ''}
                      placeholder="Texto do botão"
                      onChange={(e) => updateContent('floating_cta', { ...(content.floating_cta || { enabled: true, mode: 'link' }), label: e.target.value })}
                    />
                    <CtaModeFields
                      mode={content.floating_cta?.mode || 'link'}
                      url={content.floating_cta?.url || ''}
                      onChange={(mode, url) =>
                        updateContent('floating_cta', { ...(content.floating_cta || { enabled: true, label: '' }), mode, url })
                      }
                    />
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* SOCIALS */}
              <AccordionItem value="socials" className="border rounded-md px-3">
                <AccordionTrigger>Redes sociais</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {(['instagram', 'linkedin', 'youtube', 'facebook'] as const).map((s) => (
                    <div key={s}>
                      <Label className="capitalize">{s}</Label>
                      <Input value={content.socials[s]} placeholder={`URL do ${s}`}
                        onChange={(e) => updateContent('socials', { ...content.socials, [s]: e.target.value })} />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* FOOTER */}
              <AccordionItem value="footer" className="border rounded-md px-3">
                <AccordionTrigger>Rodapé</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <Input placeholder="Nome da empresa" value={content.footer.company_name}
                    onChange={(e) => updateContent('footer', { ...content.footer, company_name: e.target.value })} />
                  <Input placeholder="CNPJ (opcional)" value={content.footer.cnpj}
                    onChange={(e) => updateContent('footer', { ...content.footer, cnpj: e.target.value })} />
                  <Input placeholder="Texto de direitos" value={content.footer.rights_text}
                    onChange={(e) => updateContent('footer', { ...content.footer, rights_text: e.target.value })} />
                </AccordionContent>
              </AccordionItem>

              {/* TRACKING */}
              <AccordionItem value="tracking" className="border rounded-md px-3">
                <AccordionTrigger>Pixel & Rastreamento</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div>
                    <Label>ID do Pixel do Facebook</Label>
                    <Input
                      value={content.tracking?.facebook_pixel_id ?? ''}
                      placeholder="Ex: 1234567890123456"
                      inputMode="numeric"
                      maxLength={20}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 20);
                        updateContent('tracking', {
                          ...(content.tracking ?? {}),
                          facebook_pixel_id: onlyDigits,
                        });
                      }}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Preview ao vivo */}
          <Card className="overflow-hidden h-[80vh] sticky top-20 hidden lg:block">
            <div className="overflow-auto h-full origin-top-left">
              <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '181%' }}>
                <LandingPageRenderer theme={theme} content={content} />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  function updatePlan(i: number, plan: LPPlan) {
    const plans = [...content.plans_section.plans]; plans[i] = plan;
    updateContent('plans_section', { ...content.plans_section, plans });
  }
}

// ===== Helpers =====
interface CtaModeFieldsProps {
  mode: 'link' | 'form';
  url: string;
  onChange: (mode: 'link' | 'form', url: string) => void;
}

function CtaModeFields({ mode, url, onChange }: CtaModeFieldsProps) {
  return (
    <>
      <div>
        <Label>Tipo do botão</Label>
        <Select value={mode} onValueChange={(v) => onChange(v as 'link' | 'form', url)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="link">Link direto (URL)</SelectItem>
            <SelectItem value="form">Abrir formulário de cadastro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === 'link' && (
        <div>
          <Label>URL</Label>
          <Input value={url} placeholder="https://..."
            onChange={(e) => onChange(mode, e.target.value)} />
        </div>
      )}
    </>
  );
}

function ImageUploadField({
  label, value, onChange, folder,
}: { label: string; value: string; onChange: (url: string) => void; folder: string }) {
  const [uploading, setUploading] = useState(false);
  const handle = async (file: File) => {
    setUploading(true);
    const url = await uploadFile(file, folder);
    setUploading(false);
    if (url) onChange(url);
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input value={value} placeholder="URL ou faça upload"
          onChange={(e) => onChange(e.target.value)} />
        <Button variant="outline" size="sm" asChild disabled={uploading}>
          <label className="cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <input
              type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
            />
          </label>
        </Button>
      </div>
      {value && <img src={value} alt="" className="mt-2 max-h-20 rounded border" />}
    </div>
  );
}
