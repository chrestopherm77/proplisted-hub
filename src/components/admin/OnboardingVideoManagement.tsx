import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Upload, PlayCircle, Save, Link as LinkIcon } from 'lucide-react';

interface OnboardingVideo {
  id: string;
  video_url: string | null;
  video_type: 'url' | 'mp4';
  title: string | null;
  description: string | null;
}

const MAX_BYTES = 100 * 1024 * 1024; // 100MB

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}
function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function OnboardingVideoManagement() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [record, setRecord] = useState<OnboardingVideo | null>(null);
  const [videoType, setVideoType] = useState<'url' | 'mp4'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('onboarding_video')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) {
        toast.error('Erro ao carregar configuração');
      } else if (data) {
        const r = data as OnboardingVideo;
        setRecord(r);
        setVideoType(r.video_type);
        setVideoUrl(r.video_url || '');
        setTitle(r.title || '');
        setDescription(r.description || '');
      }
      setLoading(false);
    };
    load();
  }, []);

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
      const path = `onboarding-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('onboarding-videos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage
        .from('onboarding-videos')
        .getPublicUrl(path);

      setVideoUrl(pub.publicUrl);
      setVideoType('mp4');
      toast.success('Vídeo enviado! Clique em "Salvar alterações" para confirmar.');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao enviar vídeo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('onboarding_video')
        .update({
          video_url: videoUrl.trim() || null,
          video_type: videoType,
          title: title.trim() || null,
          description: description.trim() || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', record.id);
      if (error) throw error;
      toast.success('Configurações salvas!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    if (!videoUrl) {
      return (
        <div className="aspect-video w-full rounded-lg bg-muted flex flex-col items-center justify-center gap-2 border-2 border-dashed">
          <PlayCircle className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">Sem vídeo</p>
        </div>
      );
    }
    if (videoType === 'mp4') {
      return (
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <video controls className="w-full h-full" src={videoUrl} preload="metadata" />
        </div>
      );
    }
    const yt = getYouTubeId(videoUrl);
    const vm = getVimeoId(videoUrl);
    let embedSrc = videoUrl;
    if (yt) embedSrc = `https://www.youtube.com/embed/${yt}`;
    else if (vm) embedSrc = `https://player.vimeo.com/video/${vm}`;
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
        <iframe
          src={embedSrc}
          title="Preview"
          className="w-full h-full"
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Vídeo "Primeiros Passos"</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure o vídeo de boas-vindas exibido após o cadastro de novos usuários.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bem-vindo ao Conecta&Imob!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Texto exibido abaixo do título"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Origem do vídeo</Label>
              <RadioGroup
                value={videoType}
                onValueChange={(v) => setVideoType(v as 'url' | 'mp4')}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="url" id="r-url" />
                  <Label htmlFor="r-url" className="cursor-pointer flex items-center gap-1">
                    <LinkIcon className="h-3.5 w-3.5" /> URL externa (YouTube/Vimeo)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="mp4" id="r-mp4" />
                  <Label htmlFor="r-mp4" className="cursor-pointer flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" /> Upload MP4
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {videoType === 'url' ? (
              <div className="space-y-2">
                <Label htmlFor="video-url">URL do vídeo</Label>
                <Input
                  id="video-url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground">
                  Cole a URL completa do YouTube ou Vimeo.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Arquivo MP4</Label>
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
                  {uploading ? 'Enviando...' : 'Selecionar arquivo (MP4 ou WebM, até 100MB)'}
                </Button>
                {videoUrl && videoType === 'mp4' && (
                  <p className="text-xs text-muted-foreground truncate">
                    Arquivo atual: {videoUrl.split('/').pop()}
                  </p>
                )}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar alterações
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-lg font-bold">{title || 'Bem-vindo ao Conecta&Imob!'}</h3>
              <p className="text-sm text-muted-foreground">
                {description ||
                  'Assista ao vídeo abaixo e descubra como aproveitar ao máximo a plataforma.'}
              </p>
            </div>
            {renderPreview()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
