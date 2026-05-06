import { useState } from 'react';
import { BrokerPortal } from '@/hooks/useBrokerPortal';
import { FilterState, EMPTY_FILTERS } from './types';
import { Search } from 'lucide-react';

export function Hero({ portal, cities, types, onSearch }: { portal: BrokerPortal; cities: string[]; types: string[]; onSearch: (f: FilterState) => void }) {
  const b = portal.branding ?? {};
  const [f, setF] = useState<FilterState>(EMPTY_FILTERS);
  const [refMode, setRefMode] = useState(false);

  const set = (k: keyof FilterState, v: string) => setF((s) => ({ ...s, [k]: v }));

  const fmt = (v: string) => {
    const n = v.replace(/\D/g, '');
    if (!n) return '';
    return 'R$ ' + Number(n).toLocaleString('pt-BR');
  };

  return (
    <section
      className="relative min-h-[520px] flex items-center justify-center text-white"
      style={{
        backgroundImage: b.hero_bg_url
          ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${b.hero_bg_url})`
          : 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          {b.logo_url && <img src={b.logo_url} alt="logo" className="h-32 md:h-44 mx-auto mb-4" />}
          {b.hero_title && <h1 className="text-2xl md:text-4xl font-light">{b.hero_title}</h1>}
          {b.hero_subtitle && <p className="text-sm md:text-base text-white/80 mt-2">{b.hero_subtitle}</p>}
        </div>

        <div className="bg-white/95 text-foreground rounded-md p-4 max-w-5xl mx-auto shadow-2xl">
          <div className="flex items-center justify-end mb-2">
            <button
              type="button"
              onClick={() => setRefMode((v) => !v)}
              className="text-xs flex items-center gap-1 text-[var(--bp-accent-strong)] hover:underline"
            >
              <Search className="h-3 w-3" /> {refMode ? 'Filtros' : 'Referência'}
            </button>
          </div>

          {refMode ? (
            <div className="flex gap-2">
              <input
                value={f.reference}
                onChange={(e) => set('reference', e.target.value)}
                placeholder="Código de referência (ex: 153)"
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button onClick={() => onSearch(f)} className="px-6 py-2 bg-[var(--bp-accent)] text-black font-semibold rounded text-sm">
                Pesquisar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
              <Field label="Negócio">
                <select className="w-full border rounded px-2 py-2 text-sm" value={f.operation} onChange={(e) => set('operation', e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="VENDA">Venda</option>
                  <option value="ALUGUEL">Aluguel</option>
                </select>
              </Field>
              <Field label="Tipo do Imóvel">
                <select className="w-full border rounded px-2 py-2 text-sm" value={f.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                  <option value="">Selecione</option>
                  {types.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Valor mínimo">
                <input className="w-full border rounded px-2 py-2 text-sm" value={fmt(f.priceMin)} onChange={(e) => set('priceMin', e.target.value)} placeholder="R$ 0,00" />
              </Field>
              <Field label="Valor máximo">
                <input className="w-full border rounded px-2 py-2 text-sm" value={fmt(f.priceMax)} onChange={(e) => set('priceMax', e.target.value)} placeholder="R$ 0,00" />
              </Field>
              <Field label="Cidade">
                <select className="w-full border rounded px-2 py-2 text-sm" value={f.city} onChange={(e) => set('city', e.target.value)}>
                  <option value="">Selecione</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <button onClick={() => onSearch(f)} className="px-6 py-2 bg-[var(--bp-accent)] text-black font-semibold rounded text-sm">
                Pesquisar
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1">{label}</label>
      {children}
    </div>
  );
}
