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
  DEFAULT_CONTENT, DEFAULT_THEME,
  type CustomLandingPage, type LPContent, type LPTheme,
} from '@/components/admin/landing-page/types';
import { LandingPageRenderer } from '@/components/landing-page-renderer/LandingPageRenderer';
import { SectionsEditor } from '@/components/admin/landing-page/SectionsEditor';
import { normalizeSlug, validateSlug } from '@/lib/reservedSlugs';
import { useAuth } from '@/hooks/useAuth';

const ICON_OPTIONS = [
  'TrendingUp', 'Shield', 'Zap', 'Users', 'Target', 'Clock',
  'CheckCircle', 'Award', 'Heart', 'Star', 'Rocket', 'Sparkles',
];

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
  const [content, setContent] = useState<LPContent>(DEFAULT_CONTENT);

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
      setContent({
        ...DEFAULT_CONTENT,
        ...lp.content,
        header: { ...DEFAULT_CONTENT.header, ...lp.content?.header },
        hero: { ...DEFAULT_CONTENT.hero, ...lp.content?.hero },
        media: { ...DEFAULT_CONTENT.media, ...lp.content?.media },
        social_proof: { ...DEFAULT_CONTENT.social_proof, ...lp.content?.social_proof },
        final_cta: { ...DEFAULT_CONTENT.final_cta, ...lp.content?.final_cta },
        socials: { ...DEFAULT_CONTENT.socials, ...lp.content?.socials },
        footer: { ...DEFAULT_CONTENT.footer, ...lp.content?.footer },
        features: lp.content?.features ?? DEFAULT_CONTENT.features,
        floating_ctas: lp.content?.floating_ctas ?? DEFAULT_CONTENT.floating_ctas,
        sections: lp.content?.sections ?? [],
      });
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
      theme: theme as any,
      content: content as any,
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
          {/* Editor */}
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
                    placeholder="vertentes"
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

            <Accordion type="multiple" defaultValue={['theme', 'hero']} className="space-y-2">
              {/* TEMA / CORES */}
              <AccordionItem value="theme" className="border rounded-md px-3">
                <AccordionTrigger>Cores</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {(Object.keys(theme) as (keyof LPTheme)[]).map((k) => (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <Label className="capitalize">{k}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color" value={theme[k]} className="w-14 h-9 p-1"
                          onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                        />
                        <Input
                          value={theme[k]} className="w-28"
                          onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

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
                </AccordionContent>
              </AccordionItem>

              {/* HERO */}
              <AccordionItem value="hero" className="border rounded-md px-3">
                <AccordionTrigger>Hero (topo)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div>
                    <Label>Título</Label>
                    <Input value={content.hero.title}
                      onChange={(e) => updateContent('hero', { ...content.hero, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Destaque (cor primária)</Label>
                    <Input value={content.hero.highlight}
                      onChange={(e) => updateContent('hero', { ...content.hero, highlight: e.target.value })} />
                  </div>
                  <div>
                    <Label>Subtítulo</Label>
                    <Textarea value={content.hero.subtitle}
                      onChange={(e) => updateContent('hero', { ...content.hero, subtitle: e.target.value })} />
                  </div>
                  <div>
                    <Label>Texto do botão CTA</Label>
                    <Input value={content.hero.cta_label}
                      onChange={(e) => updateContent('hero', { ...content.hero, cta_label: e.target.value })} />
                  </div>
                  <div>
                    <Label>Link do botão CTA</Label>
                    <Input value={content.hero.cta_url}
                      placeholder="https://wa.me/55..."
                      onChange={(e) => updateContent('hero', { ...content.hero, cta_url: e.target.value })} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* FEATURES */}
              <AccordionItem value="features" className="border rounded-md px-3">
                <AccordionTrigger>Features ({content.features.length})</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {content.features.map((f, i) => (
                    <Card key={i} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Feature {i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => {
                          updateContent('features', content.features.filter((_, idx) => idx !== i));
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <Select value={f.icon}
                        onValueChange={(v) => {
                          const arr = [...content.features]; arr[i] = { ...f, icon: v };
                          updateContent('features', arr);
                        }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map((ic) => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input value={f.title} placeholder="Título"
                        onChange={(e) => {
                          const arr = [...content.features]; arr[i] = { ...f, title: e.target.value };
                          updateContent('features', arr);
                        }} />
                      <Textarea value={f.description} placeholder="Descrição"
                        onChange={(e) => {
                          const arr = [...content.features]; arr[i] = { ...f, description: e.target.value };
                          updateContent('features', arr);
                        }} />
                    </Card>
                  ))}
                  {content.features.length < 6 && (
                    <Button variant="outline" size="sm" onClick={() => {
                      updateContent('features', [...content.features, {
                        icon: 'Star', title: 'Nova feature', description: 'Descrição',
                      }]);
                    }}><Plus className="h-3 w-3" /> Adicionar feature</Button>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* MÍDIA CENTRAL */}
              <AccordionItem value="media" className="border rounded-md px-3">
                <AccordionTrigger>Mídia central (vídeo/imagem)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={content.media.type}
                      onValueChange={(v: any) => updateContent('media', { ...content.media, type: v, url: '' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="image">Imagem</SelectItem>
                        <SelectItem value="video">Vídeo MP4 (upload)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {content.media.type === 'youtube' && (
                    <div>
                      <Label>URL do YouTube</Label>
                      <Input value={content.media.url} placeholder="https://youtube.com/watch?v=..."
                        onChange={(e) => updateContent('media', { ...content.media, url: e.target.value })} />
                    </div>
                  )}
                  {content.media.type === 'image' && (
                    <ImageUploadField
                      label="Imagem"
                      value={content.media.url}
                      onChange={(url) => updateContent('media', { ...content.media, url })}
                      folder="media"
                    />
                  )}
                  {content.media.type === 'video' && (
                    <VideoUploadField
                      value={content.media.url}
                      onChange={(url) => updateContent('media', { ...content.media, url })}
                    />
                  )}
                  {content.media.type !== 'none' && (
                    <div>
                      <Label>Legenda (título acima da mídia)</Label>
                      <Input value={content.media.caption}
                        onChange={(e) => updateContent('media', { ...content.media, caption: e.target.value })} />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* SEÇÕES DINÂMICAS (Como Funciona, Stats, Benefícios, FAQ) */}
              <AccordionItem value="sections" className="border rounded-md px-3">
                <AccordionTrigger>
                  Seções da página ({content.sections?.length ?? 0})
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <SectionsEditor
                    sections={content.sections ?? []}
                    onChange={(next) => updateContent('sections', next)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* PROVA SOCIAL */}
              <AccordionItem value="social_proof" className="border rounded-md px-3">
                <AccordionTrigger>Prova social ({content.social_proof.testimonials.length})</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <Input placeholder="Título" value={content.social_proof.title}
                    onChange={(e) => updateContent('social_proof', { ...content.social_proof, title: e.target.value })} />
                  <Input placeholder="Subtítulo" value={content.social_proof.subtitle}
                    onChange={(e) => updateContent('social_proof', { ...content.social_proof, subtitle: e.target.value })} />
                  {content.social_proof.testimonials.map((t, i) => (
                    <Card key={i} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Depoimento {i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => updateContent('social_proof', {
                          ...content.social_proof,
                          testimonials: content.social_proof.testimonials.filter((_, idx) => idx !== i),
                        })}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <Input value={t.name} placeholder="Nome"
                        onChange={(e) => {
                          const arr = [...content.social_proof.testimonials]; arr[i] = { ...t, name: e.target.value };
                          updateContent('social_proof', { ...content.social_proof, testimonials: arr });
                        }} />
                      <Input value={t.role} placeholder="Cargo / Cidade"
                        onChange={(e) => {
                          const arr = [...content.social_proof.testimonials]; arr[i] = { ...t, role: e.target.value };
                          updateContent('social_proof', { ...content.social_proof, testimonials: arr });
                        }} />
                      <Textarea value={t.quote} placeholder="Depoimento"
                        onChange={(e) => {
                          const arr = [...content.social_proof.testimonials]; arr[i] = { ...t, quote: e.target.value };
                          updateContent('social_proof', { ...content.social_proof, testimonials: arr });
                        }} />
                      <ImageUploadField
                        label="Foto"
                        value={t.photo_url}
                        onChange={(url) => {
                          const arr = [...content.social_proof.testimonials]; arr[i] = { ...t, photo_url: url };
                          updateContent('social_proof', { ...content.social_proof, testimonials: arr });
                        }}
                        folder="testimonials"
                      />
                      <div>
                        <Label>Estrelas (1-5)</Label>
                        <Input type="number" min={1} max={5} value={t.rating || 5}
                          onChange={(e) => {
                            const arr = [...content.social_proof.testimonials];
                            arr[i] = { ...t, rating: Number(e.target.value) };
                            updateContent('social_proof', { ...content.social_proof, testimonials: arr });
                          }} />
                      </div>
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateContent('social_proof', {
                    ...content.social_proof,
                    testimonials: [...content.social_proof.testimonials, {
                      name: '', role: '', photo_url: '', quote: '', rating: 5,
                    }],
                  })}><Plus className="h-3 w-3" /> Adicionar depoimento</Button>
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
                  <Input placeholder="Texto do botão" value={content.final_cta.button_label}
                    onChange={(e) => updateContent('final_cta', { ...content.final_cta, button_label: e.target.value })} />
                  <Input placeholder="Link do botão (https://wa.me/...)" value={content.final_cta.button_url}
                    onChange={(e) => updateContent('final_cta', { ...content.final_cta, button_url: e.target.value })} />
                </AccordionContent>
              </AccordionItem>

              {/* FLOATING CTAs */}
              <AccordionItem value="floating" className="border rounded-md px-3">
                <AccordionTrigger>CTAs flutuantes (rolam até CTA final)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {content.floating_ctas.map((c, i) => (
                    <Card key={i} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Botão {i + 1}</span>
                        <Switch checked={c.enabled} onCheckedChange={(v) => {
                          const arr = [...content.floating_ctas]; arr[i] = { ...c, enabled: v };
                          updateContent('floating_ctas', arr);
                        }} />
                      </div>
                      <Input value={c.label} placeholder="Texto do botão"
                        onChange={(e) => {
                          const arr = [...content.floating_ctas]; arr[i] = { ...c, label: e.target.value };
                          updateContent('floating_ctas', arr);
                        }} />
                    </Card>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* REDES SOCIAIS */}
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
            </Accordion>
          </div>

          {/* Preview ao vivo */}
          <Card className="overflow-hidden h-[80vh] sticky top-20 hidden lg:block">
            <div className="overflow-auto h-full origin-top-left">
              <div style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '166.66%' }}>
                <LandingPageRenderer theme={theme} content={content} />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
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

function VideoUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const handle = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Vídeo muito grande (máx 50MB)');
      return;
    }
    setUploading(true);
    const url = await uploadFile(file, 'videos');
    setUploading(false);
    if (url) onChange(url);
  };
  return (
    <div>
      <Label>Vídeo MP4 (máx 50MB)</Label>
      <div className="flex items-center gap-2">
        <Input value={value} placeholder="URL do vídeo" onChange={(e) => onChange(e.target.value)} />
        <Button variant="outline" size="sm" asChild disabled={uploading}>
          <label className="cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <input type="file" accept="video/mp4" className="hidden"
              onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
          </label>
        </Button>
      </div>
      {value && <video src={value} controls className="mt-2 max-h-32 rounded border" />}
    </div>
  );
}
