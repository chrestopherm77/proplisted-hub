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
  const fmt = (v: string) => { const n = v.replace(/\D/g, ''); return n ? 'R$ ' + Number(n).toLocaleString('pt-BR') : ''; };

  return (
    <section className="relative">
      <div
        className="w-full aspect-[16/7] min-h-[320px] bg-neutral-200"
        style={{
          backgroundImage: b.hero_bg_url ? `url(${b.hero_bg_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="container mx-auto px-4 -mt-2">
        <div className="text-white p-5 md:p-6 shadow-xl rounded-sm" style={{ background: 'var(--bp-accent)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm uppercase tracking-wider">Encontre o seu imóvel ideal</p>
            <button type="button" onClick={() => setRefMode((v) => !v)} className="text-xs flex items-center gap-1 hover:underline">
              <Search className="h-3 w-3" /> {refMode ? 'Filtros' : 'Referência'}
            </button>
          </div>

          {refMode ? (
            <div className="flex gap-2">
              <input value={f.reference} onChange={(e) => set('reference', e.target.value)} placeholder="Código de referência" className="flex-1 border rounded px-3 py-2 text-sm text-neutral-800" />
              <button onClick={() => onSearch(f)} className="px-6 py-2 text-white font-semibold rounded text-sm" style={{ background: 'var(--bp-accent-strong)' }}>Pesquisar</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-neutral-800">
              <Field label="Negócio">
                <select className="w-full border rounded px-2 py-2 text-sm bg-white" value={f.operation} onChange={(e) => set('operation', e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="SALE">Venda</option>
                  <option value="RENT">Aluguel</option>
                  <option value="BOTH">Venda e Aluguel</option>
                </select>
              </Field>
              <Field label="Tipo do Imóvel">
                <select className="w-full border rounded px-2 py-2 text-sm bg-white" value={f.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                  <option value="">Selecione</option>
                  {types.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
                </select>
              </Field>
              <Field label="Valor mínimo">
                <input className="w-full border rounded px-2 py-2 text-sm bg-white" value={fmt(f.priceMin)} onChange={(e) => set('priceMin', e.target.value)} placeholder="R$ 0,00" />
              </Field>
              <Field label="Valor máximo">
                <input className="w-full border rounded px-2 py-2 text-sm bg-white" value={fmt(f.priceMax)} onChange={(e) => set('priceMax', e.target.value)} placeholder="R$ 0,00" />
              </Field>
              <Field label="Cidade">
                <select className="w-full border rounded px-2 py-2 text-sm bg-white" value={f.city} onChange={(e) => set('city', e.target.value)}>
                  <option value="">Selecione</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <div className="md:col-span-3 flex items-end">
                <button onClick={() => onSearch(f)} className="px-6 py-2 text-white font-semibold rounded text-sm" style={{ background: 'var(--bp-accent-strong)' }}>Pesquisar</button>
              </div>
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
      <label className="block text-xs font-semibold mb-1 text-white/90">{label}</label>
      {children}
    </div>
  );
}
