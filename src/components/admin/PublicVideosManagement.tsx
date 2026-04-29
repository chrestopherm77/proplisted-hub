import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2, Plus, Trash2, Pencil, Upload,
  Link as LinkIcon, Save, Copy, ExternalLink, Eye, Video,
} from 'lucide-react';

interface PublicVideo {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  video_url: string;
  video_type: 'url' | 'mp4';
  is_active: boolean;
  view_count: number;
  created_at: string;
}

const MAX_BYTES = 250 * 1024 * 1024;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export function PublicVideosManagement() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PublicVideo | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [videoType, setVideoType] = useState<'url' | 'mp4'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('public_videos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar vídeos');
    else setVideos((data || []) as PublicVideo[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setTitle(''); setSlug(''); setSlugTouched(false);
    setDescription(''); setVideoType('url');
    setVideoUrl(''); setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (v: PublicVideo) => {
    setEditing(v);
    setTitle(v.title); setSlug(v.slug); setSlugTouched(true);
    setDescription(v.description || '');
    setVideoType(v.video_type); setVideoUrl(v.video_url);
    setIsActive(v.is_active);
    setDialogOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched && !editing) setSlug(slugify(val));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      toast.error('Formato inválido. Use MP4 ou WebM.'); return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Arquivo muito grande. Máximo 250MB.'); return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const path = `public/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('onboarding-videos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('onboarding-videos').getPublicUrl(path);
      setVideoUrl(pub.publicUrl);
      setVideoType('mp4');
      toast.success('Vídeo enviado!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !videoUrl.trim()) {
      toast.error('Título, slug e vídeo são obrigatórios'); return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: slug.trim().toLowerCase(),
        title: title.trim(),
        description: description.trim() || null,
        video_url: videoUrl.trim(),
        video_type: videoType,
        is_active: isActive,
      };
      if (editing) {
        const { error } = await supabase
          .from('public_videos').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Vídeo atualizado!');
      } else {
        const { error } = await supabase
          .from('public_videos').insert({ ...payload, created_by: user?.id });
        if (error) throw error;
        toast.success('Vídeo criado!');
      }
      setDialogOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este vídeo? O link público deixará de funcionar.')) return;
    const { error } = await supabase.from('public_videos').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else { toast.success('Excluído'); await load(); }
  };

  const copyLink = (s: string) => {
    const url = `${window.location.origin}/v/${s}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const publicUrl = (s: string) => `${window.location.origin}/v/${s}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Link Público</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Suba vídeos e gere um link público para qualquer pessoa assistir, sem precisar fazer login.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar vídeo
        </Button>
      </div>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Video className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhum vídeo publicado ainda. Clique em "Adicionar vídeo".
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {videos.map((v) => (
            <Card key={v.id} className={!v.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-[240px] space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base">{v.title}</h3>
                    {!v.is_active && <Badge variant="outline">Inativo</Badge>}
                    <Badge variant="secondary" className="gap-1">
                      <Eye className="h-3 w-3" /> {v.view_count}
                    </Badge>
                  </div>
                  {v.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{v.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded px-2 py-1.5 font-mono break-all">
                    {publicUrl(v.slug)}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => copyLink(v.slug)}>
                    <Copy className="h-4 w-4 mr-1" /> Copiar link
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={publicUrl(v.slug)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                    </a>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(v)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    onClick={() => handleDelete(v.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar vídeo' : 'Adicionar vídeo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: Treinamento de vendas"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug (link público) *</Label>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">/v/</span>
                <Input
                  value={slug}
                  onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
                  placeholder="treinamento-vendas"
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e hífens.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Breve descrição exibida na página"
              />
            </div>

            <div className="space-y-2">
              <Label>Origem do vídeo</Label>
              <RadioGroup
                value={videoType}
                onValueChange={(v) => setVideoType(v as 'url' | 'mp4')}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="url" id="pv-url" />
                  <Label htmlFor="pv-url" className="cursor-pointer flex items-center gap-1">
                    <LinkIcon className="h-3.5 w-3.5" /> URL (YouTube/Vimeo)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="mp4" id="pv-mp4" />
                  <Label htmlFor="pv-mp4" className="cursor-pointer flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" /> Upload MP4
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {videoType === 'url' ? (
              <div className="space-y-2">
                <Label>URL *</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Arquivo *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="video/mp4,video/webm"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploading ? 'Enviando...' : 'Selecionar (MP4/WebM, até 250MB)'}
                </Button>
                {videoUrl && videoType === 'mp4' && (
                  <p className="text-xs text-muted-foreground truncate">
                    Arquivo: {videoUrl.split('/').pop()}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="pv-active" />
              <Label htmlFor="pv-active">Ativo (link público funciona)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
