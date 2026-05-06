import { useState } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

export interface Testimonial { name: string; text: string; }

export function Testimonials({ items }: { items: Testimonial[] }) {
  const [page, setPage] = useState(0);
  if (!items || items.length === 0) return null;
  const perPage = 3;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const cur = items.slice(page * perPage, page * perPage + perPage);
  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-light text-center mb-8" style={{ color: 'var(--bp-accent)' }}>Depoimentos</h2>
        <div className="flex items-center gap-3">
          <button disabled={totalPages < 2} onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)} className="p-2 text-neutral-400 hover:text-neutral-700 disabled:opacity-30">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
            {cur.map((t, i) => (
              <div key={i} className="text-center px-4">
                <p className="text-xs text-neutral-600 italic leading-relaxed line-clamp-[12]">"{t.text}"</p>
                <div className="mx-auto my-3 w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-neutral-500" />
                </div>
                <p className="text-sm font-semibold text-neutral-800">{t.name}</p>
              </div>
            ))}
          </div>
          <button disabled={totalPages < 2} onClick={() => setPage((p) => (p + 1) % totalPages)} className="p-2 text-neutral-400 hover:text-neutral-700 disabled:opacity-30">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
