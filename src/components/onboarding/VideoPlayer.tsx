import { PlayCircle } from 'lucide-react';

interface VideoPlayerProps {
  url: string | null | undefined;
  type: 'url' | 'mp4';
  title?: string;
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

export function VideoPlayer({ url, type, title }: VideoPlayerProps) {
  if (!url) {
    return (
      <div className="aspect-video w-full rounded-lg bg-muted flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border">
        <PlayCircle className="h-16 w-16 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground text-center px-4">Vídeo em breve.</p>
      </div>
    );
  }

  if (type === 'mp4') {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
        <video controls className="w-full h-full" src={url} preload="metadata" key={url}>
          Seu navegador não suporta vídeo HTML5.
        </video>
      </div>
    );
  }

  const yt = getYouTubeId(url);
  const vm = getVimeoId(url);
  let embedSrc = url;
  if (yt) embedSrc = `https://www.youtube.com/embed/${yt}`;
  else if (vm) embedSrc = `https://player.vimeo.com/video/${vm}`;

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
      <iframe
        key={embedSrc}
        src={embedSrc}
        title={title || 'Vídeo'}
        className="w-full h-full"
        frameBorder={0}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export { getYouTubeId, getVimeoId };
