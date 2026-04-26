import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PlayCircle, ShoppingBag, Coins, Loader2 } from 'lucide-react';

interface OnboardingVideo {
  video_url: string | null;
  video_type: 'url' | 'mp4';
  title: string | null;
  description: string | null;
}

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

export default function PrimeirosPassos() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<OnboardingVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('onboarding_video')
        .select('video_url, video_type, title, description')
        .limit(1)
        .maybeSingle();
      setVideo((data as OnboardingVideo) ?? null);
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  const renderPlayer = () => {
    if (!video?.video_url) {
      return (
        <div className="aspect-video w-full rounded-lg bg-muted flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border">
          <PlayCircle className="h-16 w-16 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground text-center px-4">
            Vídeo em breve. O administrador irá adicioná-lo em breve.
          </p>
        </div>
      );
    }

    if (video.video_type === 'mp4') {
      return (
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <video
            controls
            className="w-full h-full"
            src={video.video_url}
            preload="metadata"
          >
            Seu navegador não suporta vídeo HTML5.
          </video>
        </div>
      );
    }

    // URL externa: YouTube ou Vimeo
    const yt = getYouTubeId(video.video_url);
    const vm = getVimeoId(video.video_url);
    let embedSrc = video.video_url;
    if (yt) embedSrc = `https://www.youtube.com/embed/${yt}`;
    else if (vm) embedSrc = `https://player.vimeo.com/video/${vm}`;

    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
        <iframe
          src={embedSrc}
          title={video.title || 'Primeiros Passos'}
          className="w-full h-full"
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {video?.title || 'Bem-vindo ao Conecta&Imob!'}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {video?.description ||
              'Assista ao vídeo abaixo e descubra como aproveitar ao máximo a plataforma.'}
          </p>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              renderPlayer()
            )}
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <p className="text-center text-xs text-muted-foreground mt-6">
          Você pode rever este vídeo a qualquer momento clicando na sua foto de perfil no canto superior direito.
        </p>
      </div>
    </Layout>
  );
}
