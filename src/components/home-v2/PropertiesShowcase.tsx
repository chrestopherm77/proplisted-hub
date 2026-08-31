import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PropertyCardV2 } from './PropertyCardV2';
import { FilterState, EMPTY_FILTERS, applyFilters } from '@/components/portal-conectae/types';

const CHIPS: { id: string; label: string; apply: (f: FilterState) => FilterState }[] = [
  { id: 'all', label: 'Todos', apply: () => EMPTY_FILTERS },
  { id: 'sale', label: 'Comprar', apply: (f) => ({ ...f, operation: 'SALE', propertyType: '' }) },
  { id: 'rent', label: 'Alugar', apply: (f) => ({ ...f, operation: 'RENT', propertyType: '' }) },
  { id: 'casa', label: 'Casas', apply: (f) => ({ ...f, propertyType: 'CASA' }) },
  { id: 'apto', label: 'Apartamentos', apply: (f) => ({ ...f, propertyType: 'APARTAMENTO' }) },
  { id: 'terreno', label: 'Terrenos', apply: (f) => ({ ...f, propertyType: 'TERRENO' }) },
];

export function PropertiesShowcase({
  properties,
  filters,
  setFilters,
  onOpen,
  isFav,
  onFav,
}: {
  properties: any[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  onOpen: (id: string) => void;
  isFav: (id: string) => boolean;
  onFav: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const listed = useMemo(() => applyFilters(properties, filters), [properties, filters]);
  const visible = showAll ? listed : listed.slice(0, 6);

  const activeChip = (id: string) => {
    if (id === 'all') return JSON.stringify(filters) === JSON.stringify(EMPTY_FILTERS);
    if (id === 'sale') return filters.operation === 'SALE';
    if (id === 'rent') return filters.operation === 'RENT';
    if (id === 'casa') return filters.propertyType === 'CASA';
    if (id === 'apto') return filters.propertyType === 'APARTAMENTO';
    return filters.propertyType === 'TERRENO';
  };

  return (
    <section id="imoveis" className="bg-[hsl(var(--v2-bg-1))] py-20">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="font-display text-[28px] md:text-[38px] font-extrabold text-[hsl(var(--v2-ink))]">
              Imóveis disponíveis
            </h2>
            <p className="mt-2 max-w-xl text-[15px] text-[hsl(var(--v2-body))]">
              Anúncios de corretores parceiros da Conectaê em todo o Brasil.
            </p>
          </div>
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[hsl(var(--v2-line))] px-6 py-3 text-sm font-bold text-[hsl(var(--v2-blue))] hover:bg-white transition"
          >
            Ver todos os imóveis <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2.5">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setFilters(c.apply(filters));
                setShowAll(false);
              }}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                activeChip(c.id)
                  ? 'bg-[hsl(var(--v2-blue))] text-white'
                  : 'border border-[hsl(var(--v2-line))] bg-white text-[hsl(var(--v2-body))] hover:border-[hsl(var(--v2-cyan))]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="py-20 text-center text-[hsl(var(--v2-body))]">
            Nenhum imóvel encontrado com esses critérios.
          </p>
        ) : (
          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <PropertyCardV2
                key={p.id}
                property={p}
                isFav={isFav(p.id)}
                onFav={() => onFav(p.id)}
                onOpen={() => onOpen(p.id)}
              />
            ))}
          </div>
        )}

        {!showAll && listed.length > 6 && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="rounded-full bg-[hsl(var(--v2-blue))] px-8 py-3.5 text-sm font-bold text-white hover:brightness-110 transition"
            >
              Ver mais imóveis
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
