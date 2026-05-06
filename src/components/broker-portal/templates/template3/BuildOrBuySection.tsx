import { BrokerPortal } from '@/hooks/useBrokerPortal';

interface Item { image_url?: string; title?: string; description?: string; link?: string; }

export function BuildOrBuySection({ portal }: { portal: BrokerPortal }) {
  const b = portal.branding ?? {};
  const items: Item[] = Array.isArray(b.build_or_buy) ? b.build_or_buy.slice(0, 3) : [];
  if (items.length === 0) return null;
  return (
    <section className="py-12" style={{ background: 'var(--bp-bg-light)' }}>
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-light text-center mb-8 tracking-wide" style={{ color: 'var(--bp-accent)' }}>Comprar casa pronta ou construir</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((it, i) => {
            const inner = (
              <div className="relative group aspect-[4/3] overflow-hidden rounded-md shadow-md bg-neutral-200">
                {it.image_url && <img src={it.image_url} alt={it.title || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                {(it.title || it.description) && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                    {it.title && <p className="text-sm font-semibold tracking-wide">{it.title}</p>}
                    {it.description && <p className="text-xs opacity-90 mt-1 line-clamp-2">{it.description}</p>}
                  </div>
                )}
              </div>
            );
            return it.link
              ? <a key={i} href={it.link} target="_blank" rel="noreferrer">{inner}</a>
              : <div key={i}>{inner}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
