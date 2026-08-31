import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { FilterState, EMPTY_FILTERS, typeLabel } from '@/components/portal-conectae/types';

const HERO_BG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80';

export function HomeHero({
  cities,
  types,
  onSearch,
}: {
  cities: string[];
  types: string[];
  onSearch: (f: FilterState) => void;
}) {
  const [f, setF] = useState<FilterState>(EMPTY_FILTERS);
  const set = (k: keyof FilterState, v: string) => setF((s) => ({ ...s, [k]: v }));

  const fmt = (v: string) => {
    const n = v.replace(/\D/g, '');
    return n ? 'R$ ' + Number(n).toLocaleString('pt-BR') : '';
  };

  return (
    <section
      className="relative min-h-[640px] flex items-center text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0.58)), url(${HERO_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-3xl">
          <span className="inline-block text-xs uppercase tracking-[0.2em] text-white/70 mb-4">
            Conectaê Imob
          </span>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Encontre o imóvel certo — com um corretor de verdade do seu lado
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/85 max-w-2xl">
            Imóveis anunciados por corretores parceiros em todo o Brasil. Busque, demonstre interesse
            e fale direto com quem entende do bairro.
          </p>
        </div>

        <div className="bg-background/95 text-foreground rounded-xl p-4 mt-8 shadow-2xl max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <Field label="Objetivo">
              <select
                className="w-full border rounded-md px-2 py-2 text-sm bg-background"
                value={f.operation}
                onChange={(e) => set('operation', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="SALE">Comprar</option>
                <option value="RENT">Alugar</option>
              </select>
            </Field>
            <Field label="Cidade">
              <select
                className="w-full border rounded-md px-2 py-2 text-sm bg-background"
                value={f.city}
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
                className="w-full border rounded-md px-2 py-2 text-sm bg-background"
                value={f.propertyType}
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
                className="w-full border rounded-md px-2 py-2 text-sm bg-background"
                value={fmt(f.priceMin)}
                onChange={(e) => set('priceMin', e.target.value)}
                placeholder="R$ 0"
                inputMode="numeric"
              />
            </Field>
            <Field label="Valor máximo">
              <input
                className="w-full border rounded-md px-2 py-2 text-sm bg-background"
                value={fmt(f.priceMax)}
                onChange={(e) => set('priceMax', e.target.value)}
                placeholder="R$ 0"
                inputMode="numeric"
              />
            </Field>
            <button
              onClick={() => onSearch(f)}
              className="h-10 px-6 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <Search className="h-4 w-4" /> Buscar
            </button>
          </div>
        </div>

        <Link
          to="/corretor"
          className="inline-flex items-center gap-1 mt-5 text-sm text-white/80 hover:text-white underline underline-offset-4"
        >
          É corretor? Anuncie seus imóveis grátis <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1 text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
