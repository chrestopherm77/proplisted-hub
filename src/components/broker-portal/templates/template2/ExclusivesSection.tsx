import { BrokerPortal } from '@/hooks/useBrokerPortal';
import { getCoverPhoto } from '@/lib/propertyUtils';

export function ExclusivesSection({ portal, properties, onOpen }: { portal: BrokerPortal; properties: any[]; onOpen: (id: string) => void }) {
  const items = properties.slice(0, 3);
  if (items.length === 0) return null;
  const b = portal.branding ?? {};
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-light text-center mb-8" style={{ color: 'var(--bp-accent)' }}>Imóveis Exclusivos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((p) => {
            const cover = getCoverPhoto(p.photos || []);
            return (
              <button key={p.id} onClick={() => onOpen(p.id)} className="relative group aspect-[4/5] overflow-hidden rounded-md shadow-md">
                {cover && <img src={cover} alt={p.title || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                <div className="absolute inset-0 flex items-center justify-center">
                  {b.logo_url && <img src={b.logo_url} alt="" className="h-20 md:h-24 opacity-90 drop-shadow-xl" />}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-white">
                  <p className="text-xs uppercase tracking-wider opacity-80">{p.neighborhood} - {p.city}/{p.state}</p>
                  <p className="text-sm font-semibold line-clamp-1">{p.title || `Ref. ${p.reference_code}`}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
