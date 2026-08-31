import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Reveal } from './Reveal';

export interface NewsItem {
  id: string;
  title: string | null;
  image_url: string | null;
  created_at: string | null;
}

export function NewsSection({ news }: { news: NewsItem[] }) {
  if (!news.length) return null;

  const half = Math.ceil(news.length / 2);
  const rowA = news.slice(0, half);
  const rowB = news.slice(half).length ? news.slice(half) : news;

  return (
    <section id="noticias" className="overflow-hidden bg-[hsl(var(--v2-bg-2))] py-20">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-16">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 className="font-display text-[28px] md:text-[38px] font-extrabold text-[hsl(var(--v2-ink))]">
                Giro do Mercado
              </h2>
              <p className="mt-2 max-w-xl text-[15px] text-[hsl(var(--v2-body))]">
                O que está movimentando o mercado imobiliário nesta semana.
              </p>
            </div>
            <Link
              to="/conectaeimob/noticias"
              className="inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--v2-blue))] hover:gap-3 transition-all"
            >
              Ver todas as notícias <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="mt-10 space-y-6">
        <MarqueeRow items={rowA} direction="left" />
        <MarqueeRow items={rowB} direction="right" />
      </div>
    </section>
  );
}

function MarqueeRow({ items, direction }: { items: NewsItem[]; direction: 'left' | 'right' }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const loop = [...items, ...items, ...items];
  const duration = Math.max(28, items.length * 9);

  const nudge = (dir: -1 | 1) => {
    trackRef.current?.parentElement?.scrollBy({ left: dir * 380, behavior: 'smooth' });
  };

  return (
    <div className="group relative">
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex w-max gap-6 px-5 lg:px-16 group-hover:[animation-play-state:paused]"
          style={{
            animation: `v2-marquee-${direction} ${duration}s linear infinite`,
          }}
        >
          {loop.map((n, i) => (
            <NewsCard key={`${n.id}-${i}`} item={n} />
          ))}
        </div>
      </div>

      <button
        onClick={() => nudge(-1)}
        aria-label="Notícias anteriores"
        className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[hsl(var(--v2-blue))] shadow-[var(--v2-shadow-card)] transition hover:scale-105 md:grid"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
      </button>
      <button
        onClick={() => nudge(1)}
        aria-label="Próximas notícias"
        className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[hsl(var(--v2-blue))] shadow-[var(--v2-shadow-card)] transition hover:scale-105 md:grid"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link
      to="/conectaeimob/noticias"
      className="group/card flex w-[320px] shrink-0 flex-col overflow-hidden rounded-[18px] bg-white shadow-[var(--v2-shadow-card)] transition-shadow hover:shadow-[0_18px_40px_hsl(var(--v2-navy)/0.14)]"
    >
      {item.image_url && (
        <div className="aspect-[16/9] overflow-hidden bg-[hsl(var(--v2-bg-3))]">
          <img
            src={item.image_url}
            alt={item.title || 'Notícia do mercado imobiliário'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        {item.created_at && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--v2-green))]">
            {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        )}
        <h3 className="mt-2 line-clamp-3 font-display text-[17px] font-bold text-[hsl(var(--v2-ink))]">
          {item.title}
        </h3>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-[hsl(var(--v2-blue))]">
          Ler matéria <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </div>
    </Link>
  );
}
