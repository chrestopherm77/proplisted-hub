import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VideoPlayer } from '@/components/onboarding/VideoPlayer';
import { BrandLogo } from '@/components/BrandLogo';
import { Loader2, VideoOff } from 'lucide-react';

interface PublicVideoData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  video_url: string;
  video_type: 'url' | 'mp4';
}

export default function PublicVideo() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<PublicVideoData | null>(null);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('public_videos')
        .select('id, slug, title, description, video_url, video_type')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (!cancelled) {
        setVideo((data as PublicVideoData) || null);
        setLoading(false);
        if (data) {
          supabase.rpc('increment_public_video_view', { p_slug: slug }).then(() => {});
        }
        if (data?.title) document.title = `${data.title} | Conecta&Imob`;
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" lang="pt-BR" translate="no">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center" lang="pt-BR" translate="no">
        <VideoOff className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Vídeo não disponível</h1>
        <p className="text-muted-foreground mb-6">Este link expirou ou foi removido.</p>
        <Link to="/" className="text-primary hover:underline text-sm">Voltar para a página inicial</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" lang="pt-BR" translate="no">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center">
          <Link to="/" className="flex items-center">
            <BrandLogo size="md" />
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-0 md:px-6 py-0 md:py-8">
          <div className="px-4 md:px-0 py-5 md:py-0 md:mb-6">
            <h1 className="text-2xl md:text-4xl font-bold leading-tight">{video.title}</h1>
            {video.description && (
              <p className="text-muted-foreground mt-2 md:mt-3 text-sm md:text-base">
                {video.description}
              </p>
            )}
          </div>

          <div className="md:rounded-xl overflow-hidden md:shadow-lg md:border border-border bg-black">
            <VideoPlayer url={video.video_url} type={video.video_type} title={video.title} />
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4 mt-auto">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Conecta&Imob
        </p>
      </footer>
    </div>
  );
}
