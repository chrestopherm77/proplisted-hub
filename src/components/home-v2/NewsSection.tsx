import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';

export interface NewsItem {
  id: string;
  title: string | null;
  image_url: string | null;
  created_at: string | null;
}

function NewsCard({ n }: { n: NewsItem }) {
  return (
    <Link
      to="/conectaeimob/noticias"
      className="group w-[300px] sm:w-[340px] shrink-0 rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-shadow"
    >
      <div className="aspect-[16/9] bg-muted overflow-hidden">
        {n.image_url && (
          <img
            src={n.image_url}
            alt={n.title || 'Notícia do mercado imobiliário'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
      </div>
      <div className="p-4">
        {n.created_at && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(n.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        )}
        <h3 className="font-semibold mt-1 line-clamp-2">{n.title}</h3>
      </div>
    </Link>
  );
}

function MarqueeRow({
  items,
  direction,
  registerRef,
}: {
  items: NewsItem[];
  direction: 'left' | 'right';
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  // Duplica os itens para loop contínuo
  const doubled = [...items, ...items];
  return (
    <div ref={registerRef} className="news-marquee" data-direction={direction}>
      <div className="news-marquee-track py-1">
        {doubled.map((n, i) => (
          <NewsCard key={`${n.id}-${i}`} n={n} />
        ))}
      </div>
    </div>
  );
}

export function NewsSection({ news }: { news: NewsItem[] }) {
  const rowARef = useRef<HTMLDivElement | null>(null);
  const rowBRef = useRef<HTMLDivElement | null>(null);
  const hoverRef = useRef(false);

  const rowA = news.filter((_, i) => i % 2 === 0);
  const rowB = news.filter((_, i) => i % 2 === 1);
  const hasTwoRows = rowB.length > 0;

  // Rolagem automática contínua: linha de cima para a esquerda, de baixo para a direita
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const section = document.getElementById('noticias');

    // Posições acumuladas em JS — scrollLeft arredonda para inteiro,
    // então incrementos fracionários precisam ser acumulados fora do DOM
    let posA = section?.querySelectorAll<HTMLDivElement>('.news-marquee')[0]?.scrollLeft ?? 0;
    let posB: number | null = null;

    let raf: number;
    const speed = 0.5; // px por frame — movimento suave e devagar

    const tick = () => {
      if (!hoverRef.current) {
        const rows = section?.querySelectorAll<HTMLDivElement>('.news-marquee');
        const a = rows?.[0] ?? null;
        const b = rows?.[1] ?? null;
        if (a) {
          const halfA = a.scrollWidth / 2;
          if (halfA > 0) {
            posA += speed;
            if (posA >= halfA) posA -= halfA;
            a.scrollLeft = posA;
          }
        }
        if (b) {
          const halfB = b.scrollWidth / 2;
          if (halfB > 0) {
            if (posB === null) posB = halfB; // começa no fim: rola para a direita
            posB -= speed;
            if (posB <= 0) posB += halfB;
            b.scrollLeft = posB;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [news]);

  // Setas: esquerda acelera o fluxo (cima→esquerda, baixo→direita); direita inverte
  const nudge = (dir: 'left' | 'right') => {
    const amount = 340;
    const a = rowARef.current;
    const b = rowBRef.current;
    const deltaA = dir === 'left' ? amount : -amount;
    const deltaB = -deltaA;
    a?.scrollBy({ left: deltaA, behavior: 'smooth' });
    b?.scrollBy({ left: deltaB, behavior: 'smooth' });
  };

  if (!news.length) return null;

  return (
    <section id="noticias" className="py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Newspaper className="h-7 w-7 text-primary" />
              Giro do Mercado
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              O que está movimentando o mercado imobiliário nesta semana.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => nudge('right')}
                aria-label="Notícias anteriores"
                className="h-10 w-10 rounded-full border bg-card text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => nudge('left')}
                aria-label="Próximas notícias"
                className="h-10 w-10 rounded-full border bg-card text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <Link
              to="/conectaeimob/noticias"
              className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline"
            >
              Ver todas as notícias <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div
        className="space-y-5"
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}
      >
        <MarqueeRow
          items={rowA}
          direction="left"
          registerRef={(el) => (rowARef.current = el)}
        />
        {hasTwoRows && (
          <MarqueeRow
            items={rowB}
            direction="right"
            registerRef={(el) => (rowBRef.current = el)}
          />
        )}
      </div>
    </section>
  );
}
