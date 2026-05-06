import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PropertyCard } from './PropertyCard';

export function FeaturedGrid({
  title,
  properties,
  fav,
  onOpen,
}: {
  title: string;
  properties: any[];
  fav: { has: (id: string) => boolean; toggle: (id: string) => void };
  onOpen: (id: string) => void;
}) {
  const perPage = 8;
  const [page, setPage] = useState(0);
  if (properties.length === 0) return null;
  const totalPages = Math.max(1, Math.ceil(properties.length / perPage));
  const cur = properties.slice(page * perPage, page * perPage + perPage);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-light text-center mb-8 tracking-wide" style={{ color: 'var(--bp-accent)' }}>{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cur.map((p) => (
            <PropertyCard key={p.id} property={p} isFav={fav.has(p.id)} onFav={() => fav.toggle(p.id)} onOpen={() => onOpen(p.id)} />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-6 text-sm">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center disabled:opacity-30" disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${i === page ? 'text-white' : 'text-neutral-700 hover:bg-neutral-200'}`}
                style={i === page ? { background: 'var(--bp-accent-strong)' } : undefined}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center disabled:opacity-30" disabled={page === totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
