import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, Save, Eye, EyeOff, Loader2, RotateCcw, ExternalLink,
  Plus, Trash2,
} from 'lucide-react';
import {
  DEFAULT_HOME_CONTENT, mergeHomeContent, type HomeContent,
} from '@/components/admin/home-page/types';
import { IconPicker } from '@/components/admin/shared/IconPicker';
import { ImageUploadField } from '@/components/admin/shared/ImageUploadField';
import Index from '@/pages/Index';
import { HomeContentContext } from '@/components/admin/home-page/HomeContentContext';

export function HomePageEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('editor');
  const [content, setContent] = useState<HomeContent>(DEFAULT_HOME_CONTENT);
  const [rowId, setRowId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('home_page_content').select('*').limit(1).maybeSingle();
      if (!error && data) {
        setRowId(data.id);
        setContent(mergeHomeContent(data.content as Partial<HomeContent>));
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      content: content as any,
      updated_by: user?.id ?? null,
    };
    let error;
    if (rowId) {
      ({ error } = await supabase
        .from('home_page_content').update(payload).eq('id', rowId));
    } else {
      const { data, error: insertErr } = await supabase
        .from('home_page_content')
        .insert({ singleton: true, ...payload } as any).select('id').single();
      error = insertErr;
      if (data) setRowId(data.id);
    }
    setSaving(false);
    if (error) toast.error('Erro ao salvar: ' + error.message);
    else toast.success('Página principal atualizada!');
  };

  const handleReset = () => {
    setContent(DEFAULT_HOME_CONTENT);
    toast.info('Conteúdo restaurado para o padrão. Clique em Salvar para confirmar.');
  };

  // Helper genérico de update
  const update = <K extends keyof HomeContent>(key: K, value: HomeContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 sticky top-0 z-30 bg-background/95 backdrop-blur py-2 -mt-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/landing-pages')}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <h2 className="text-xl font-bold truncate">Página Principal</h2>
          <Badge variant="secondary">/</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Abrir home
            </a>
          </Button>
          <div className="inline-flex rounded-md border bg-muted/30 p-0.5">
            <Button
              variant={viewMode === 'editor' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('editor')}
            >
              <EyeOff className="h-3.5 w-3.5" /> Editor
            </Button>
            <Button
              variant={viewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 hidden lg:inline-flex"
              onClick={() => setViewMode('split')}
            >
              <Eye className="h-3.5 w-3.5" /> Split
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('preview')}
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" /> Restaurar padrão
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restaurar conteúdo padrão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todo o conteúdo será revertido ao texto e ícones originais. Você ainda
                  precisará clicar em Salvar para aplicar publicamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Restaurar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      {showPreview ? (
        <Card className="overflow-hidden">
          <HomeContentContext.Provider value={content}>
            <Index />
          </HomeContentContext.Provider>
        </Card>
      ) : (
        <Tabs defaultValue="header" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 justify-start">
            <TabsTrigger value="header">Cabeçalho</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="features">Funcionalidades (9)</TabsTrigger>
            <TabsTrigger value="extras">Extras (2)</TabsTrigger>
            <TabsTrigger value="how">Como Funciona</TabsTrigger>
            <TabsTrigger value="stats">Stats (3)</TabsTrigger>
            <TabsTrigger value="plans">Planos (4)</TabsTrigger>
            <TabsTrigger value="cta">CTA Final</TabsTrigger>
          </TabsList>

          {/* ============== CABEÇALHO ============== */}
          <TabsContent value="header">
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Logo e botões do topo</h3>
              <ImageUploadField
                label="Logo (deixe vazio para usar o logo textual padrão Conectaae imob)"
                value={content.header.brand_logo_url}
                onChange={(url) => update('header', { ...content.header, brand_logo_url: url })}
                folder="home/logo"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Texto do botão "Entrar"</Label>
                  <Input value={content.header.login_label}
                    onChange={(e) => update('header', { ...content.header, login_label: e.target.value })} />
                </div>
                <div>
                  <Label>Texto do botão "Cadastre-se"</Label>
                  <Input value={content.header.signup_label}
                    onChange={(e) => update('header', { ...content.header, signup_label: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Mostrar botão "Entrar" no topo</Label>
                <Switch checked={content.header.show_login_button}
                  onCheckedChange={(v) => update('header', { ...content.header, show_login_button: v })} />
              </div>
            </Card>
          </TabsContent>

          {/* ============== HERO ============== */}
          <TabsContent value="hero">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Topo da página</h3>
              <div>
                <Label>Badge (linha pequena acima do título)</Label>
                <Input value={content.hero.badge_text}
                  onChange={(e) => update('hero', { ...content.hero, badge_text: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Título — primeira linha</Label>
                  <Input value={content.hero.title_line1}
                    onChange={(e) => update('hero', { ...content.hero, title_line1: e.target.value })} />
                </div>
                <div>
                  <Label>Título — segunda linha (em destaque)</Label>
                  <Input value={content.hero.title_line2}
                    onChange={(e) => update('hero', { ...content.hero, title_line2: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Textarea value={content.hero.subtitle} rows={3}
                  onChange={(e) => update('hero', { ...content.hero, subtitle: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Texto do CTA primário (vai para cadastro)</Label>
                  <Input value={content.hero.cta_primary_label}
                    onChange={(e) => update('hero', { ...content.hero, cta_primary_label: e.target.value })} />
                </div>
                <div>
                  <Label>Texto do CTA secundário (rola até planos)</Label>
                  <Input value={content.hero.cta_secondary_label}
                    onChange={(e) => update('hero', { ...content.hero, cta_secondary_label: e.target.value })} />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ============== FUNCIONALIDADES (9) ============== */}
          <TabsContent value="features">
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Seção de funcionalidades</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label>Badge</Label>
                  <Input value={content.features_section.badge}
                    onChange={(e) => update('features_section', { ...content.features_section, badge: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Título</Label>
                  <Input value={content.features_section.title}
                    onChange={(e) => update('features_section', { ...content.features_section, title: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Textarea value={content.features_section.subtitle} rows={2}
                  onChange={(e) => update('features_section', { ...content.features_section, subtitle: e.target.value })} />
              </div>

              <div className="border-t pt-3 space-y-3">
                <p className="text-xs text-muted-foreground">9 cards fixos. Você pode trocar ícone, título e descrição de cada um.</p>
                {content.features_section.items.map((item, i) => (
                  <Card key={i} className="p-3 space-y-2 bg-muted/30">
                    <div className="text-xs font-semibold text-muted-foreground">Card {i + 1}</div>
                    <div className="grid sm:grid-cols-[160px_1fr] gap-2">
                      <IconPicker value={item.icon} onChange={(icon) => {
                        const arr = [...content.features_section.items];
                        arr[i] = { ...item, icon };
                        update('features_section', { ...content.features_section, items: arr });
                      }} />
                      <Input value={item.title} placeholder="Título"
                        onChange={(e) => {
                          const arr = [...content.features_section.items];
                          arr[i] = { ...item, title: e.target.value };
                          update('features_section', { ...content.features_section, items: arr });
                        }} />
                    </div>
                    <Textarea value={item.desc} placeholder="Descrição" rows={2}
                      onChange={(e) => {
                        const arr = [...content.features_section.items];
                        arr[i] = { ...item, desc: e.target.value };
                        update('features_section', { ...content.features_section, items: arr });
                      }} />
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ============== EXTRAS (2) ============== */}
          <TabsContent value="extras">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Cards extras (Educação e Jurídico)</h3>
              <p className="text-xs text-muted-foreground">2 cards fixos exibidos abaixo das funcionalidades.</p>
              {content.extras.map((item, i) => (
                <Card key={i} className="p-3 space-y-2 bg-muted/30">
                  <div className="text-xs font-semibold text-muted-foreground">Extra {i + 1}</div>
                  <div className="grid sm:grid-cols-[160px_1fr] gap-2">
                    <IconPicker value={item.icon} onChange={(icon) => {
                      const arr = [...content.extras]; arr[i] = { ...item, icon };
                      update('extras', arr);
                    }} />
                    <Input value={item.title} placeholder="Título"
                      onChange={(e) => {
                        const arr = [...content.extras]; arr[i] = { ...item, title: e.target.value };
                        update('extras', arr);
                      }} />
                  </div>
                  <Textarea value={item.desc} placeholder="Descrição" rows={2}
                    onChange={(e) => {
                      const arr = [...content.extras]; arr[i] = { ...item, desc: e.target.value };
                      update('extras', arr);
                    }} />
                </Card>
              ))}
            </Card>
          </TabsContent>

          {/* ============== COMO FUNCIONA ============== */}
          <TabsContent value="how">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Seção "Como funciona"</h3>
              <div>
                <Label>Título</Label>
                <Input value={content.how_it_works.title}
                  onChange={(e) => update('how_it_works', { ...content.how_it_works, title: e.target.value })} />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input value={content.how_it_works.subtitle}
                  onChange={(e) => update('how_it_works', { ...content.how_it_works, subtitle: e.target.value })} />
              </div>
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs text-muted-foreground">3 passos numerados (1, 2, 3).</p>
                {content.how_it_works.steps.map((step, i) => (
                  <Card key={i} className="p-3 space-y-2 bg-muted/30">
                    <div className="text-xs font-semibold text-muted-foreground">Passo {i + 1}</div>
                    <Input value={step.title} placeholder="Título do passo"
                      onChange={(e) => {
                        const arr = [...content.how_it_works.steps];
                        arr[i] = { ...step, title: e.target.value };
                        update('how_it_works', { ...content.how_it_works, steps: arr });
                      }} />
                    <Textarea value={step.desc} placeholder="Descrição" rows={2}
                      onChange={(e) => {
                        const arr = [...content.how_it_works.steps];
                        arr[i] = { ...step, desc: e.target.value };
                        update('how_it_works', { ...content.how_it_works, steps: arr });
                      }} />
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ============== STATS (3) ============== */}
          <TabsContent value="stats">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Estatísticas (3 números grandes)</h3>
              {content.stats.items.map((item, i) => (
                <Card key={i} className="p-3 space-y-2 bg-muted/30">
                  <div className="text-xs font-semibold text-muted-foreground">Stat {i + 1}</div>
                  <div className="grid sm:grid-cols-[160px_1fr_1fr] gap-2">
                    <IconPicker value={item.icon} onChange={(icon) => {
                      const arr = [...content.stats.items]; arr[i] = { ...item, icon };
                      update('stats', { items: arr });
                    }} />
                    <Input value={item.value} placeholder='Número (ex: "500+")'
                      onChange={(e) => {
                        const arr = [...content.stats.items]; arr[i] = { ...item, value: e.target.value };
                        update('stats', { items: arr });
                      }} />
                    <Input value={item.label} placeholder='Legenda (ex: "Corretores ativos")'
                      onChange={(e) => {
                        const arr = [...content.stats.items]; arr[i] = { ...item, label: e.target.value };
                        update('stats', { items: arr });
                      }} />
                  </div>
                </Card>
              ))}
            </Card>
          </TabsContent>

          {/* ============== PLANOS (4) ============== */}
          <TabsContent value="plans">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Seção de planos</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label>Badge</Label>
                  <Input value={content.plans_section.badge}
                    onChange={(e) => update('plans_section', { ...content.plans_section, badge: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Título</Label>
                  <Input value={content.plans_section.title}
                    onChange={(e) => update('plans_section', { ...content.plans_section, title: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Textarea value={content.plans_section.subtitle} rows={2}
                  onChange={(e) => update('plans_section', { ...content.plans_section, subtitle: e.target.value })} />
              </div>
              <div>
                <Label>Texto do rodapé da seção</Label>
                <Input value={content.plans_section.footer_note}
                  onChange={(e) => update('plans_section', { ...content.plans_section, footer_note: e.target.value })} />
              </div>

              <div className="border-t pt-3 space-y-4">
                <p className="text-xs text-muted-foreground">
                  4 planos fixos. O slug de cada plano é travado pois alimenta o checkout automático.
                </p>
                {content.plans_section.plans.map((plan, i) => (
                  <Card key={plan.slug} className="p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-muted-foreground">
                        Plano {i + 1}
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        slug: {plan.slug}
                      </Badge>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Nome</Label>
                        <Input value={plan.name}
                          onChange={(e) => {
                            const arr = [...content.plans_section.plans];
                            arr[i] = { ...plan, name: e.target.value };
                            update('plans_section', { ...content.plans_section, plans: arr });
                          }} />
                      </div>
                      <div>
                        <Label className="text-xs">Preço (texto)</Label>
                        <Input value={plan.price} placeholder="R$ 39,90"
                          onChange={(e) => {
                            const arr = [...content.plans_section.plans];
                            arr[i] = { ...plan, price: e.target.value };
                            update('plans_section', { ...content.plans_section, plans: arr });
                          }} />
                      </div>
                      <div>
                        <Label className="text-xs">Sufixo do preço</Label>
                        <Input value={plan.priceSuffix} placeholder="/mês"
                          onChange={(e) => {
                            const arr = [...content.plans_section.plans];
                            arr[i] = { ...plan, priceSuffix: e.target.value };
                            update('plans_section', { ...content.plans_section, plans: arr });
                          }} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Linha de créditos</Label>
                        <Input value={plan.credits} placeholder="30 créditos/mês"
                          onChange={(e) => {
                            const arr = [...content.plans_section.plans];
                            arr[i] = { ...plan, credits: e.target.value };
                            update('plans_section', { ...content.plans_section, plans: arr });
                          }} />
                      </div>
                      <div>
                        <Label className="text-xs">Texto do botão CTA</Label>
                        <Input value={plan.cta} placeholder="Assinar"
                          onChange={(e) => {
                            const arr = [...content.plans_section.plans];
                            arr[i] = { ...plan, cta: e.target.value };
                            update('plans_section', { ...content.plans_section, plans: arr });
                          }} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Lista de benefícios</Label>
                      <div className="space-y-1.5">
                        {plan.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex gap-2">
                            <Input value={feat}
                              onChange={(e) => {
                                const arr = [...content.plans_section.plans];
                                const feats = [...plan.features];
                                feats[fIdx] = e.target.value;
                                arr[i] = { ...plan, features: feats };
                                update('plans_section', { ...content.plans_section, plans: arr });
                              }} />
                            <Button variant="ghost" size="sm"
                              onClick={() => {
                                const arr = [...content.plans_section.plans];
                                arr[i] = { ...plan, features: plan.features.filter((_, x) => x !== fIdx) };
                                update('plans_section', { ...content.plans_section, plans: arr });
                              }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm"
                          onClick={() => {
                            const arr = [...content.plans_section.plans];
                            arr[i] = { ...plan, features: [...plan.features, 'Novo benefício'] };
                            update('plans_section', { ...content.plans_section, plans: arr });
                          }}>
                          <Plus className="h-3 w-3" /> Adicionar benefício
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ============== CTA FINAL ============== */}
          <TabsContent value="cta">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Bloco final da página</h3>
              <div>
                <Label>Título</Label>
                <Input value={content.final_cta.title}
                  onChange={(e) => update('final_cta', { ...content.final_cta, title: e.target.value })} />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Textarea value={content.final_cta.subtitle} rows={2}
                  onChange={(e) => update('final_cta', { ...content.final_cta, subtitle: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Texto do botão CTA</Label>
                  <Input value={content.final_cta.cta_label}
                    onChange={(e) => update('final_cta', { ...content.final_cta, cta_label: e.target.value })} />
                </div>
                <div>
                  <Label>Link "Já tem cadastro?"</Label>
                  <Input value={content.final_cta.secondary_text}
                    onChange={(e) => update('final_cta', { ...content.final_cta, secondary_text: e.target.value })} />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
