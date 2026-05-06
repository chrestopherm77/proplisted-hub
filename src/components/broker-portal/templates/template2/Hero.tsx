import { useState } from 'react';
import { BrokerPortal } from '@/hooks/useBrokerPortal';
import { FilterState, EMPTY_FILTERS } from '../template1/types';
import { Search } from 'lucide-react';

export function Hero({ portal, cities, types, onSearch }: { portal: BrokerPortal; cities: string[]; types: string[]; onSearch: (f: FilterState) => void }) {
  const typeLabel = (t: string) => ({ APARTAMENTO: 'Apartamento', CASA: 'Casa', SOBRADO: 'Sobrado', COBERTURA: 'Cobertura', TERRENO: 'Terreno', SALA_COMERCIAL: 'Sala Comercial', GALPAO: 'Galpão', SITIO: 'Sítio', CHACARA: 'Chácara', AREA_DE_LAZER: 'Área de Lazer' } as Record<string, string>)[t] || t;
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
      className="relative min-h-[520px] flex items-end text-white overflow-hidden"
      style={{
        backgroundImage: b.hero_bg_url
          ? `linear-gradient(rgba(15,30,60,0.55), rgba(15,30,60,0.75)), url(${b.hero_bg_url})`
          : 'linear-gradient(135deg, #0f1e3c, #1e3a8a)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto px-4 pt-16 pb-24 relative z-10 w-full">
        <div className="text-center mb-8">
          {b.hero_title && <h1 className="text-3xl md:text-5xl font-light drop-shadow">{b.hero_title}</h1>}
          {b.hero_subtitle && <p className="text-sm md:text-lg text-white/85 mt-2">{b.hero_subtitle}</p>}
        </div>

        <div className="bg-white text-foreground rounded-md shadow-2xl max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-end mb-2">
            <button
              type="button"
              onClick={() => setRefMode((v) => !v)}
              className="text-xs flex items-center gap-1 text-[color:var(--bp-accent)] hover:underline"
            >
              <Search className="h-3 w-3" /> {refMode ? 'Filtros' : 'Referência'}
            </button>
          </div>
          {refMode ? (
            <div className="flex gap-2">
              <input value={f.reference} onChange={(e) => set('reference', e.target.value)} placeholder="Código de referência" className="flex-1 border rounded px-3 py-2 text-sm" />
              <button onClick={() => onSearch(f)} className="px-6 py-2 text-white font-semibold rounded text-sm" style={{ background: 'var(--bp-accent)' }}>Pesquisar</button>
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
              <button onClick={() => onSearch(f)} className="px-6 py-2 text-white font-semibold rounded text-sm" style={{ background: 'var(--bp-accent)' }}>Pesquisar</button>
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
      <label className="block text-xs font-semibold mb-1 text-neutral-700">{label}</label>
      {children}
    </div>
  );
}
