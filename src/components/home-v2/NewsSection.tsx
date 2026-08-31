import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, Newspaper } from 'lucide-react';

export interface NewsItem {
  id: string;
  title: string | null;
  image_url: string | null;
  created_at: string | null;
}

export function NewsSection({ news }: { news: NewsItem[] }) {
  if (!news.length) return null;
  return (
    <section id="noticias" className="py-20">
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
          <Link
            to="/conectaeimob/noticias"
            className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline"
          >
            Ver todas as notícias <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {news.slice(0, 6).map((n) => (
            <Link
              key={n.id}
              to="/conectaeimob/noticias"
              className="group rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-shadow"
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
          ))}
        </div>
      </div>
    </section>
  );
}
