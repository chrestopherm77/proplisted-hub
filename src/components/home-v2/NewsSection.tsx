import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';

export interface NewsItem {
  id: string;
  title: string | null;
  image_url: string | null;
  created_at: string | null;
}

export function NewsSection({ news }: { news: NewsItem[] }) {
  if (!news.length) return null;

  return (
    <section id="noticias" className="bg-[hsl(var(--v2-bg-2))] py-20">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-16">
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

        <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {news.slice(0, 6).map((n) => (
            <Link
              key={n.id}
              to="/conectaeimob/noticias"
              className="group flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[var(--v2-shadow-card)] transition-shadow hover:shadow-[0_18px_40px_hsl(var(--v2-navy)/0.14)]"
            >
              {n.image_url && (
                <div className="aspect-[16/9] overflow-hidden bg-[hsl(var(--v2-bg-3))]">
                  <img
                    src={n.image_url}
                    alt={n.title || 'Notícia do mercado imobiliário'}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                {n.created_at && (
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--v2-green))]">
                    {format(new Date(n.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                )}
                <h3 className="mt-2 line-clamp-3 font-display text-[17px] font-bold text-[hsl(var(--v2-ink))]">
                  {n.title}
                </h3>
                <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[hsl(var(--v2-blue))]">
                  Ler matéria <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
