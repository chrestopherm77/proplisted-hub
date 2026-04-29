import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PlayCircle, ShoppingBag, Coins, Loader2 } from 'lucide-react';
import { VideoPlayer } from '@/components/onboarding/VideoPlayer';

interface MainVideo {
  video_url: string | null;
  video_type: 'url' | 'mp4';
  title: string | null;
  description: string | null;
}

interface PlaylistItem {
  id: string;
  title: string;
  topic: string | null;
  video_url: string;
  video_type: 'url' | 'mp4';
  thumbnail_url: string | null;
  description: string | null;
}

interface SelectedVideo {
  url: string | null;
  type: 'url' | 'mp4';
  title: string;
  description: string | null;
}

export default function PrimeirosPassos() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [main, setMain] = useState<MainVideo | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      const [mainRes, listRes] = await Promise.all([
        supabase
          .from('onboarding_video')
          .select('video_url, video_type, title, description')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('onboarding_videos')
          .select('id, title, topic, video_url, video_type, thumbnail_url, description')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);
      setMain((mainRes.data as MainVideo) ?? null);
      setPlaylist((listRes.data as PlaylistItem[]) ?? []);
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  const selected: SelectedVideo = useMemo(() => {
    if (selectedId) {
      const item = playlist.find((p) => p.id === selectedId);
      if (item) {
        return {
          url: item.video_url,
          type: item.video_type,
          title: item.title,
          description: item.description,
        };
      }
    }
    return {
      url: main?.video_url ?? null,
      type: main?.video_type ?? 'url',
      title: main?.title || 'Bem-vindo ao Conecta&Imob!',
      description:
        main?.description ||
        'Assista ao vídeo abaixo e descubra como aproveitar ao máximo a plataforma.',
    };
  }, [selectedId, playlist, main]);

  return (
    <Layout>
      <div className="mx-auto py-4 md:py-8 px-0 md:px-4 max-w-none md:max-w-7xl">
        <div className="text-center mb-6 md:mb-8 px-4">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3">{selected.title}</h1>
          {selected.description && (
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              {selected.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Player principal */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden rounded-none md:rounded-lg border-0 md:border shadow-none md:shadow-lg">
              <CardContent className="p-0 md:p-4">
                {loading ? (
                  <div className="aspect-video w-full md:rounded-lg bg-muted flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <VideoPlayer
                    url={selected.url}
                    type={selected.type}
                    title={selected.title}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Playlist */}
          <div className="lg:col-span-1 px-4 md:px-0">
            <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              Próximos vídeos
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-0 md:space-y-2 lg:max-h-[560px] lg:overflow-y-auto lg:pr-2 -mx-4 md:mx-0">
                {/* Item destaque (vídeo principal) */}
                {main?.video_url && (
                  <PlaylistCard
                    title={main.title || 'Boas-vindas'}
                    topic="Destaque"
                    thumb={null}
                    type={main.video_type}
                    url={main.video_url}
                    active={!selectedId}
                    onClick={() => setSelectedId(null)}
                  />
                )}
                {playlist.map((p) => (
                  <PlaylistCard
                    key={p.id}
                    title={p.title}
                    topic={p.topic}
                    thumb={p.thumbnail_url}
                    type={p.video_type}
                    url={p.video_url}
                    active={selectedId === p.id}
                    onClick={() => setSelectedId(p.id)}
                  />
                ))}
                {!main?.video_url && playlist.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8 px-4">
                    Nenhum vídeo disponível ainda.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto px-4 md:px-0">
          <Button
            size="lg"
            variant="default"
            onClick={() => navigate('/my-leads')}
            className="h-auto py-4"
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            Ir para Meus Leads
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/comprar-creditos')}
            className="h-auto py-4"
          >
            <Coins className="mr-2 h-5 w-5" />
            Comprar Créditos
          </Button>
        </div>
      </div>
    </Layout>
  );
}

function PlaylistCard({
  title,
  topic,
  thumb,
  type,
  url,
  active,
  onClick,
}: {
  title: string;
  topic: string | null;
  thumb: string | null;
  type: 'url' | 'mp4';
  url: string;
  active: boolean;
  onClick: () => void;
}) {
  // Fallback automático para Vimeo se thumb não vier
  const vimeoMatch = !thumb && type === 'url' && url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const ytMatch = !thumb && type === 'url' && url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  const computedThumb =
    thumb ||
    (ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : null);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border transition-all hover:bg-accent/50 group ${
        active ? 'border-primary bg-accent/30' : 'border-border'
      }`}
    >
      <div className="flex gap-3 p-2">
        <div className="w-28 aspect-video rounded bg-muted overflow-hidden flex-shrink-0 relative">
          {computedThumb ? (
            <img
              src={computedThumb}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <PlayCircle className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
            <PlayCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0 py-1">
          {topic && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mb-1">
              {topic}
            </Badge>
          )}
          <p className="text-sm font-medium leading-snug line-clamp-2">{title}</p>
        </div>
      </div>
    </button>
  );
}
