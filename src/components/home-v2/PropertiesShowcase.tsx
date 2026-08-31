import { useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import { PropertyCard } from '@/components/portal-conectae/PropertyCard';
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
  const visible = showAll ? listed : listed.slice(0, 12);

  const activeChip = (id: string) => {
    if (id === 'all') return JSON.stringify(filters) === JSON.stringify(EMPTY_FILTERS);
    if (id === 'sale') return filters.operation === 'SALE';
    if (id === 'rent') return filters.operation === 'RENT';
    if (id === 'casa') return filters.propertyType === 'CASA';
    if (id === 'apto') return filters.propertyType === 'APARTAMENTO';
    return filters.propertyType === 'TERRENO';
  };

  return (
    <section id="imoveis" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Imóveis disponíveis
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Anúncios de corretores parceiros da Conectaê em todo o Brasil.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">{listed.length} imóveis</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => { setFilters(c.apply(filters)); setShowAll(false); }}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                activeChip(c.id)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground hover:border-primary'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            Nenhum imóvel encontrado com esses critérios.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                isFav={isFav(p.id)}
                onFav={() => onFav(p.id)}
                onOpen={() => onOpen(p.id)}
              />
            ))}
          </div>
        )}

        {!showAll && listed.length > 12 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(true)}
              className="px-6 py-2.5 rounded-md border font-medium text-sm hover:bg-background transition"
            >
              Ver todos os imóveis
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
