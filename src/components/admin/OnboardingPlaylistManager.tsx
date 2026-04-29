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
  Loader2,
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  PlayCircle,
  Upload,
  Link as LinkIcon,
  Save,
} from 'lucide-react';
import { getYouTubeId, getVimeoId } from '@/components/onboarding/VideoPlayer';

interface PlaylistVideo {
  id: string;
  title: string;
  topic: string | null;
  video_url: string;
  video_type: 'url' | 'mp4';
  thumbnail_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

const MAX_BYTES = 100 * 1024 * 1024;

async function fetchVimeoThumb(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail_url || null;
  } catch {
    return null;
  }
}

function autoThumb(url: string, type: 'url' | 'mp4'): string | null {
  if (type === 'mp4') return null;
  const yt = getYouTubeId(url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return null;
}

export function OnboardingPlaylistManager() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlaylistVideo | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [videoType, setVideoType] = useState<'url' | 'mp4'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('onboarding_videos')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) toast.error('Erro ao carregar playlist');
    else setVideos((data || []) as PlaylistVideo[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setTopic('');
    setVideoType('url');
    setVideoUrl('');
    setDescription('');
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (v: PlaylistVideo) => {
    setEditing(v);
    setTitle(v.title);
    setTopic(v.topic || '');
    setVideoType(v.video_type);
    setVideoUrl(v.video_url);
    setDescription(v.description || '');
    setIsActive(v.is_active);
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      toast.error('Formato inválido. Use MP4 ou WebM.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Arquivo muito grande. Máximo 100MB.');
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const path = `playlist-${Date.now()}.${ext}`;
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
    if (!title.trim() || !videoUrl.trim()) {
      toast.error('Título e URL/arquivo são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      let thumb = autoThumb(videoUrl, videoType);
      if (!thumb && videoType === 'url' && getVimeoId(videoUrl)) {
        thumb = await fetchVimeoThumb(videoUrl);
      }

      if (editing) {
        const { error } = await supabase
          .from('onboarding_videos')
          .update({
            title: title.trim(),
            topic: topic.trim() || null,
            video_url: videoUrl.trim(),
            video_type: videoType,
            thumbnail_url: thumb,
            description: description.trim() || null,
            is_active: isActive,
            updated_by: user?.id,
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Vídeo atualizado!');
      } else {
        const nextOrder = videos.length
          ? Math.max(...videos.map((v) => v.sort_order)) + 1
          : 0;
        const { error } = await supabase.from('onboarding_videos').insert({
          title: title.trim(),
          topic: topic.trim() || null,
          video_url: videoUrl.trim(),
          video_type: videoType,
          thumbnail_url: thumb,
          description: description.trim() || null,
          is_active: isActive,
          sort_order: nextOrder,
          updated_by: user?.id,
        });
        if (error) throw error;
        toast.success('Vídeo adicionado!');
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
    if (!confirm('Remover este vídeo da playlist?')) return;
    const { error } = await supabase.from('onboarding_videos').delete().eq('id', id);
    if (error) toast.error('Erro ao remover');
    else {
      toast.success('Removido');
      await load();
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= videos.length) return;
    const a = videos[idx];
    const b = videos[target];
    const updates = await Promise.all([
      supabase
        .from('onboarding_videos')
        .update({ sort_order: b.sort_order })
        .eq('id', a.id),
      supabase
        .from('onboarding_videos')
        .update({ sort_order: a.sort_order })
        .eq('id', b.id),
    ]);
    if (updates.some((r) => r.error)) toast.error('Erro ao reordenar');
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Playlist da página Primeiros Passos</h3>
          <p className="text-sm text-muted-foreground">
            Vídeos exibidos ao lado do vídeo principal. Clicar troca o player.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar vídeo
        </Button>
      </div>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum vídeo na playlist. Clique em "Adicionar vídeo".
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {videos.map((v, idx) => (
            <Card key={v.id} className={!v.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-32 aspect-video rounded bg-muted overflow-hidden flex-shrink-0">
                  {v.thumbnail_url ? (
                    <img
                      src={v.thumbnail_url}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayCircle className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {v.topic && <Badge variant="secondary">{v.topic}</Badge>}
                    {!v.is_active && <Badge variant="outline">Inativo</Badge>}
                  </div>
                  <p className="font-medium truncate mt-1">{v.title}</p>
                  {v.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {v.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => move(idx, 1)}
                    disabled={idx === videos.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="icon" variant="ghost" onClick={() => openEdit(v)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(v.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar vídeo' : 'Adicionar vídeo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Como comprar leads"
              />
            </div>
            <div className="space-y-2">
              <Label>Tópico (opcional)</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Leads, Criativos"
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
                  <RadioGroupItem value="url" id="pl-url" />
                  <Label htmlFor="pl-url" className="cursor-pointer flex items-center gap-1">
                    <LinkIcon className="h-3.5 w-3.5" /> URL (Vimeo/YouTube)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="mp4" id="pl-mp4" />
                  <Label htmlFor="pl-mp4" className="cursor-pointer flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" /> Upload
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
                  placeholder="https://vimeo.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Thumbnail do Vimeo/YouTube será buscada automaticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Arquivo</Label>
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
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? 'Enviando...' : 'Selecionar (MP4/WebM, até 100MB)'}
                </Button>
                {videoUrl && (
                  <p className="text-xs text-muted-foreground truncate">
                    {videoUrl.split('/').pop()}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="pl-active" />
              <Label htmlFor="pl-active">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
