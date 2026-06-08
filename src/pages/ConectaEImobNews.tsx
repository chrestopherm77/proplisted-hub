import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Newspaper, Search, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

interface NewsPost {
  id: string;
  title: string | null;
  image_url: string | null;
  content: string;
  created_at: string;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const renderContentWithLinks = (text: string) => {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:opacity-80 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const PAGE_SIZE = 10;

const ConectaEImobNews = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from('news_posts')
      .select('id, title, image_url, content, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!data || data.length < PAGE_SIZE) setHasMore(false);
    setPosts((prev) => (append ? [...prev, ...(data || [])] : data || []));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts(0);
    document.title = 'Notícias do Mercado — ConectaEImob';
  }, [fetchPosts]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  };

  return (
    <div translate="no" lang="pt-BR" className="min-h-screen bg-[hsl(210_17%_97%)]">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link to="/conectaeimob" className="font-display text-2xl font-bold tracking-tight text-[hsl(var(--portal-navy))]">
            ConectaEImob
          </Link>
          <Link
            to="/conectaeimob"
            className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--portal-navy))] hover:opacity-70"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <div className="container mx-auto py-10 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          {/* Coluna principal */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-6">
              <Newspaper className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold text-[hsl(var(--portal-navy))]">Notícias do Mercado</h1>
            </div>

        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl border border-border py-12 text-center text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma notícia publicada ainda.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl overflow-hidden border border-border shadow-sm">
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.title || ''}
                    className="w-full max-h-[500px] object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-5 space-y-3">
                  {post.title && (
                    <h2 className="text-xl font-extrabold text-[hsl(var(--portal-navy))] leading-tight border-l-4 border-primary pl-3">
                      {post.title}
                    </h2>
                  )}
                  <div>
                    <p className={`text-foreground whitespace-pre-wrap break-words ${!expanded[post.id] ? 'line-clamp-4' : ''}`}>
                      {renderContentWithLinks(post.content)}
                    </p>
                    {post.content.length > 200 && (
                      <button
                        onClick={() => setExpanded((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                        className="text-primary text-sm font-medium mt-1"
                      >
                        {expanded[post.id] ? 'Ver menos' : 'Ver mais'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(post.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </article>
            ))}

            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="rounded-full border border-[hsl(var(--portal-navy))] text-[hsl(var(--portal-navy))] hover:bg-[hsl(var(--portal-navy))] hover:text-white px-6 py-2.5 text-sm font-semibold transition disabled:opacity-50"
                >
                  {loading ? 'Carregando...' : 'Carregar mais'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConectaEImobNews;
