import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { PropertyCardV2 } from './PropertyCardV2';
import { Reveal } from './Reveal';
import { FilterState, EMPTY_FILTERS, applyFilters, typeLabel } from '@/components/portal-conectae/types';
import logoAsset from '@/assets/conectae-logo-branco.png.asset.json';

const logo = (logoAsset as { url: string }).url;
const HERO_BG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80';

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
  cities,
  types,
  onOpen,
  isFav,
  onFav,
}: {
  properties: any[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  cities: string[];
  types: string[];
  onOpen: (id: string) => void;
  isFav: (id: string) => boolean;
  onFav: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [draft, setDraft] = useState<FilterState>(EMPTY_FILTERS);
  const [refMode, setRefMode] = useState(false);

  const set = (k: keyof FilterState, v: string) => setDraft((s) => ({ ...s, [k]: v }));

  const fmt = (v: string) => {
    const n = v.replace(/\D/g, '');
    return n ? 'R$ ' + Number(n).toLocaleString('pt-BR') : '';
  };

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

  const search = () => {
    setFilters(draft);
    setShowAll(false);
  };

  return (
    <section id="imoveis" className="bg-[hsl(var(--v2-bg-1))] pb-20">
      {/* Banner do Portal Conectaê */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--v2-navy) / 0.82), hsl(var(--v2-blue) / 0.78)), url(${HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto max-w-[1440px] px-5 lg:px-16 pt-16 pb-28 text-center">
          <Reveal>
            <img src={logo} alt="Portal Conectaê Imob" className="mx-auto h-20 md:h-24 w-auto" />
            <h2 className="mt-6 font-display text-[28px] md:text-[40px] font-extrabold text-white">
              O portal de imóveis da <span className="text-[hsl(var(--v2-mint))]">Conectaê</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] md:text-base text-[hsl(var(--v2-on-dark))]">
              Imóveis de corretores parceiros verificados em todo o Brasil. Encontre o seu e
              demonstre interesse em um clique.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Card de busca flutuante sobre o banner */}
      <div className="mx-auto -mt-16 max-w-[1440px] px-5 lg:px-16">
        <Reveal>
          <div className="rounded-3xl bg-white p-5 md:p-6 shadow-[var(--v2-shadow-float)]">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setRefMode((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--v2-line))] px-4 py-1.5 text-xs font-bold text-[hsl(var(--v2-blue))] hover:bg-[hsl(var(--v2-bg-2))] transition"
              >
                <Search className="h-3.5 w-3.5" strokeWidth={2.2} />
                {refMode ? 'Buscar por filtros' : 'Buscar por referência'}
              </button>
            </div>

            {refMode ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={draft.reference}
                  onChange={(e) => set('reference', e.target.value)}
                  placeholder="Código de referência (ex: 153)"
                  className="flex-1 rounded-xl bg-[hsl(var(--v2-bg-2))] px-4 py-3 text-sm text-[hsl(var(--v2-ink))] outline-none"
                />
                <button
                  onClick={search}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--v2-green))] px-7 py-3 text-sm font-bold text-white hover:brightness-105 transition"
                >
                  <Search className="h-4 w-4" strokeWidth={2.2} /> Pesquisar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 items-end gap-3 md:gap-4 lg:grid-cols-6">
                <Field label="Objetivo">
                  <select
                    className="w-full rounded-xl bg-[hsl(var(--v2-bg-2))] px-3 py-3 text-sm text-[hsl(var(--v2-ink))] outline-none"
                    value={draft.operation}
                    onChange={(e) => set('operation', e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="SALE">Comprar</option>
                    <option value="RENT">Alugar</option>
                    <option value="BOTH">Venda e Aluguel</option>
                  </select>
                </Field>
                <Field label="Cidade">
                  <select
                    className="w-full rounded-xl bg-[hsl(var(--v2-bg-2))] px-3 py-3 text-sm text-[hsl(var(--v2-ink))] outline-none"
                    value={draft.city}
                    onChange={(e) => set('city', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tipo do imóvel">
                  <select
                    className="w-full rounded-xl bg-[hsl(var(--v2-bg-2))] px-3 py-3 text-sm text-[hsl(var(--v2-ink))] outline-none"
                    value={draft.propertyType}
                    onChange={(e) => set('propertyType', e.target.value)}
                  >
                    <option value="">Todos</option>
                    {types.map((t) => (
                      <option key={t} value={t}>{typeLabel(t)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Valor mínimo">
                  <input
                    className="w-full rounded-xl bg-[hsl(var(--v2-bg-2))] px-3 py-3 text-sm text-[hsl(var(--v2-ink))] outline-none"
                    value={fmt(draft.priceMin)}
                    onChange={(e) => set('priceMin', e.target.value)}
                    placeholder="R$ 0"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Valor máximo">
                  <input
                    className="w-full rounded-xl bg-[hsl(var(--v2-bg-2))] px-3 py-3 text-sm text-[hsl(var(--v2-ink))] outline-none"
                    value={fmt(draft.priceMax)}
                    onChange={(e) => set('priceMax', e.target.value)}
                    placeholder="R$ 0"
                    inputMode="numeric"
                  />
                </Field>
                <button
                  onClick={search}
                  className="col-span-2 inline-flex h-[46px] items-center justify-center gap-2 rounded-full bg-[hsl(var(--v2-green))] px-6 text-sm font-bold text-white hover:brightness-105 transition lg:col-span-1"
                >
                  <Search className="h-4 w-4" strokeWidth={2.2} /> Buscar
                </button>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-14 max-w-[1440px] px-5 lg:px-16">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h3 className="font-display text-[28px] md:text-[38px] font-extrabold text-[hsl(var(--v2-ink))]">
                Imóveis disponíveis
              </h3>
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
        </Reveal>

        {visible.length === 0 ? (
          <p className="py-20 text-center text-[hsl(var(--v2-body))]">
            Nenhum imóvel encontrado com esses critérios.
          </p>
        ) : (
          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 90}>
                <PropertyCardV2
                  property={p}
                  isFav={isFav(p.id)}
                  onFav={() => onFav(p.id)}
                  onOpen={() => onOpen(p.id)}
                />
              </Reveal>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--v2-body))]">
        {label}
      </label>
      {children}
    </div>
  );
}
