import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Newspaper, ArrowRight, ArrowUpRight } from 'lucide-react';
import logoAsset from '@/assets/conectae-logo-branco.png.asset.json';

const logo = logoAsset.url;

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
          className="text-[hsl(var(--v2-blue-vivid))] underline hover:opacity-80 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const PAGE_SIZE = 9;

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
    document.title = 'Giro do Mercado — Conectae';
  }, [fetchPosts]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  };

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div translate="no" lang="pt-BR" className="site-v2 min-h-screen bg-[hsl(var(--v2-bg-1))]">
      {/* Header escuro */}
      <header className="sticky top-0 z-50 bg-[hsl(var(--v2-navy))]">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 lg:px-16">
          <Link to="/" aria-label="Conectae" className="shrink-0">
            <img src={logo} alt="Conectae" className="h-8 w-auto object-contain" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--v2-on-dark))] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} /> Voltar ao portal
          </Link>
        </div>
      </header>

      {/* Hero do portal de notícias */}
      <section className="v2-dark relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-dots-pattern opacity-30" />
        <div className="relative mx-auto max-w-[1440px] px-5 py-16 md:py-24 lg:px-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[hsl(var(--v2-mint))]">
            <Newspaper className="h-3.5 w-3.5" strokeWidth={2.2} />
            Portal de notícias
          </span>
          <h1 className="mt-5 font-display text-[34px] font-extrabold leading-tight text-white md:text-[54px]">
            Giro do Mercado
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[hsl(var(--v2-on-dark))] md:text-lg">
            Tudo o que movimenta o mercado imobiliário: tendências, lançamentos, financiamento
            e oportunidades — direto, sem ruído.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 py-12 md:py-16 lg:px-16">
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--v2-blue))] border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[18px] bg-white py-16 text-center shadow-[var(--v2-shadow-card)]">
            <Newspaper className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--v2-meta))]" />
            <p className="text-[hsl(var(--v2-body))]">Nenhuma notícia publicada ainda.</p>
          </div>
        ) : (
          <>
            {/* Destaque principal */}
            {featured && (
              <article className="group mb-10 overflow-hidden rounded-[22px] bg-white shadow-[var(--v2-shadow-card)] md:grid md:grid-cols-2">
                {featured.image_url && (
                  <div className="aspect-[16/10] overflow-hidden bg-[hsl(var(--v2-bg-3))] md:aspect-auto md:h-full">
                    <img
                      src={featured.image_url}
                      alt={featured.title || 'Notícia em destaque'}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex flex-col p-7 md:p-10">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--v2-green))]">
                    Destaque ·{' '}
                    {format(new Date(featured.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  {featured.title && (
                    <h2 className="mt-3 font-display text-[24px] font-extrabold leading-tight text-[hsl(var(--v2-ink))] md:text-[32px]">
                      {featured.title}
                    </h2>
                  )}
                  <p
                    className={`mt-4 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[hsl(var(--v2-body))] ${
                      !expanded[featured.id] ? 'line-clamp-6' : ''
                    }`}
                  >
                    {renderContentWithLinks(featured.content)}
                  </p>
                  {featured.content.length > 300 && (
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [featured.id]: !prev[featured.id] }))}
                      className="mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-bold text-[hsl(var(--v2-blue))]"
                    >
                      {expanded[featured.id] ? 'Ver menos' : 'Ler matéria completa'}
                      <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  )}
                </div>
              </article>
            )}

            {/* Grade de notícias */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <article
                  key={post.id}
                  className="group flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[var(--v2-shadow-card)] transition-shadow hover:shadow-[0_18px_40px_hsl(var(--v2-navy)/0.14)]"
                >
                  {post.image_url && (
                    <div className="aspect-[16/9] overflow-hidden bg-[hsl(var(--v2-bg-3))]">
                      <img
                        src={post.image_url}
                        alt={post.title || 'Notícia do mercado imobiliário'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--v2-green))]">
                      {format(new Date(post.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    {post.title && (
                      <h3 className="mt-2 line-clamp-3 font-display text-[17px] font-bold text-[hsl(var(--v2-ink))]">
                        {post.title}
                      </h3>
                    )}
                    <p
                      className={`mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[hsl(var(--v2-body))] ${
                        !expanded[post.id] ? 'line-clamp-4' : ''
                      }`}
                    >
                      {renderContentWithLinks(post.content)}
                    </p>
                    {post.content.length > 200 && (
                      <button
                        onClick={() => setExpanded((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                        className="mt-auto inline-flex w-fit items-center gap-1.5 pt-4 text-sm font-bold text-[hsl(var(--v2-blue))]"
                      >
                        {expanded[post.id] ? 'Ver menos' : 'Ler matéria'}
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {hasMore && (
              <div className="py-10 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="rounded-full bg-[hsl(var(--v2-navy))] px-8 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? 'Carregando...' : 'Carregar mais notícias'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA corretor */}
      <section className="v2-dark">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center lg:px-16">
          <div>
            <h2 className="font-display text-[24px] font-extrabold text-white md:text-[30px]">
              É corretor de imóveis?
            </h2>
            <p className="mt-2 max-w-xl text-[15px] text-[hsl(var(--v2-on-dark))]">
              Cadastre-se grátis na Conectae, anuncie seus imóveis e receba leads qualificados da sua região.
            </p>
          </div>
          <Link
            to="/cadastro"
            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--v2-mint))] px-7 py-3.5 text-sm font-bold text-[hsl(var(--v2-navy))] transition hover:brightness-105"
          >
            Criar conta grátis <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ConectaEImobNews;
