import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Download, Trash2, Eye, ImageOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Creative {
  id: string;
  style_slug: string;
  format: string;
  info_text: string | null;
  main_image_url: string | null;
  mockup_images: any;
  status: string;
  error_message?: string | null;
  created_at: string;
}

const FORMAT_LABEL: Record<string, string> = { POST: 'Post 1080×1080', STORIES: 'Stories 1080×1920', TRAFEGO: 'Tráfego 1200×628' };

export function MyCreatives({ onGenerate }: { onGenerate: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Creative | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('creatives')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems((data as Creative[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // Realtime: refresh when any creative of this user changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`my-creatives-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'creatives', filter: `user_id=eq.${user.id}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este criativo?')) return;
    const { error } = await supabase.from('creatives').delete().eq('id', id);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    toast({ title: 'Excluído com sucesso' });
    load();
  };

  const handleDownload = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url; a.download = name; a.target = '_blank';
    document.body.appendChild(a); a.click(); a.remove();
  };

  const getThumb = (c: Creative): string | null => {
    if (c.main_image_url) return c.main_image_url;
    const arr = Array.isArray(c.mockup_images) ? c.mockup_images : [];
    return arr[0]?.image_url || null;
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum criativo ainda</h3>
          <p className="text-muted-foreground mb-6">Comece criando seu primeiro criativo imobiliário.</p>
          <Button onClick={onGenerate}><Sparkles className="h-4 w-4 mr-2" />Gerar primeiro criativo</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((c) => {
          const thumb = getThumb(c);
          const isActive = activeId === c.id;
          return (
            <Card
              key={c.id}
              className="overflow-hidden group cursor-pointer relative"
              onClick={() => setActiveId((prev) => (prev === c.id ? null : c.id))}
            >
              <div className="aspect-square bg-muted relative">
                {thumb ? (
                  <img src={thumb} alt="Criativo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><ImageOff className="h-8 w-8 text-muted-foreground" /></div>
                )}
                <div className={cn(
                  "absolute inset-0 bg-background/80 transition-opacity flex items-center justify-center gap-2",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelected(c); }}><Eye className="h-4 w-4" /></Button>
                  {thumb && <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); handleDownload(thumb, `criativo-${c.id}.jpg`); }}><Download className="h-4 w-4" /></Button>}
                  <Button size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">{FORMAT_LABEL[c.format] || c.format}</Badge>
                  {c.status === 'PENDING' && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3 animate-pulse" />Gerando…
                    </Badge>
                  )}
                  {c.status === 'FAILED' && (
                    <Badge variant="destructive" className="text-xs">Falhou</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">{c.style_slug}</p>
                <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
              </CardContent>
              {isActive && (
                <button
                  className="absolute top-1 right-1 p-1 rounded-full bg-background/90 hover:bg-background text-foreground z-20"
                  onClick={(e) => { e.stopPropagation(); setActiveId(null); }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criativo — {selected && FORMAT_LABEL[selected.format]}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.info_text && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.info_text}</p>}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selected.main_image_url ? (
                  <div className="relative col-span-2 md:col-span-3">
                    <Badge className="absolute top-2 left-2 z-10">Principal</Badge>
                    <img src={selected.main_image_url} alt="Principal" className="w-full rounded" />
                  </div>
                ) : (
                  <Card className="col-span-2 md:col-span-3 border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground text-sm">
                      Imagem principal será gerada pela IA — em breve
                    </CardContent>
                  </Card>
                )}
                {(Array.isArray(selected.mockup_images) ? selected.mockup_images : []).map((m: any, i: number) => (
                  <img key={i} src={m.image_url} alt={`Mockup ${i + 1}`} className="w-full rounded" />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
