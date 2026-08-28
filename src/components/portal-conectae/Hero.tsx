import { useState } from 'react';
import { FilterState, EMPTY_FILTERS, typeLabel } from './types';
import { Search } from 'lucide-react';
import logoAsset from '@/assets/conectae-logo-branco.png.asset.json';

const logo = logoAsset.url;
const HERO_BG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80';

export function Hero({ cities, types, onSearch }: { cities: string[]; types: string[]; onSearch: (f: FilterState) => void }) {
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
      className="relative min-h-[520px] flex items-center justify-center text-white overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #101010, #232323 55%, #101010)' }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--pc-bg)]/90 via-[var(--pc-bg)]/40 to-transparent z-10" />
      <div className="container mx-auto px-4 py-16 relative z-20">
        <div className="text-center mb-10">
          <img src={logo} alt="Portal Conectaê Imob" className="h-24 md:h-28 mx-auto mb-6" />
          <h1 className="text-2xl md:text-4xl font-light">O portal de imóveis da Conectaê</h1>
          <p className="text-sm md:text-base text-white/80 mt-2">
            Milhares de imóveis de parceiros verificados. Encontre o seu e demonstre interesse em um clique.
          </p>
        </div>

        <div className="bg-white/95 text-foreground rounded-md p-4 max-w-5xl mx-auto shadow-2xl">
          <div className="flex items-center justify-end mb-2">
            <button
              type="button"
              onClick={() => setRefMode((v) => !v)}
              className="text-xs flex items-center gap-1 text-[var(--pc-accent-strong)] hover:underline"
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
              <button onClick={() => onSearch(f)} className="px-6 py-2 bg-[var(--pc-accent)] text-black font-semibold rounded text-sm">
                Pesquisar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
              <Field label="Negócio">
                <select className="w-full border rounded px-2 py-2 text-sm" value={f.operation} onChange={(e) => set('operation', e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="SALE">Venda</option>
                  <option value="RENT">Aluguel</option>
                  <option value="BOTH">Venda e Aluguel</option>
                </select>
              </Field>
              <Field label="Tipo do Imóvel">
                <select className="w-full border rounded px-2 py-2 text-sm" value={f.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                  <option value="">Selecione</option>
                  {types.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
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
              <button onClick={() => onSearch(f)} className="px-6 py-2 bg-[var(--pc-accent)] text-black font-semibold rounded text-sm">
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
