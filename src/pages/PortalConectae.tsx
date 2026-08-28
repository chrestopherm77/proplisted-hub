import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/portal-conectae/Header';
import { Hero } from '@/components/portal-conectae/Hero';
import { PropertyCard } from '@/components/portal-conectae/PropertyCard';
import { PropertyDetail } from '@/components/portal-conectae/PropertyDetail';
import { Footer } from '@/components/portal-conectae/Footer';
import { useFavorites } from '@/components/portal-conectae/useFavorites';
import { EMPTY_FILTERS, FilterState, applyFilters } from '@/components/portal-conectae/types';
import { Loader2 } from 'lucide-react';

export default function PortalConectae() {
  const [params, setParams] = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [section, setSection] = useState('home');
  const fav = useFavorites();

  const selectedId = params.get('imovel');

  useEffect(() => {
    document.title = 'Portal Conectaê | Imóveis à venda e para alugar';
    const desc = 'Encontre imóveis à venda e para alugar no Portal Conectaê. Demonstre interesse e receba o contato de um parceiro.';
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
    m.setAttribute('content', desc);
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('list_portal_conectae_properties' as any);
      if (!error && data) setProperties(data as any[]);
      setLoading(false);
    })();
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(properties.map((p) => p.city).filter(Boolean))).sort() as string[],
    [properties]
  );
  const types = useMemo(
    () => Array.from(new Set(properties.map((p) => p.property_type).filter(Boolean))).sort() as string[],
    [properties]
  );

  const listed = useMemo(() => {
    const base = section === 'favoritos' ? properties.filter((p) => fav.has(p.id)) : properties;
    return applyFilters(base, filters);
  }, [properties, filters, section, fav]);

  const selected = properties.find((p) => p.id === selectedId);

  const openProperty = (id: string) => {
    setParams({ imovel: id });
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    setParams({});
    setSection('imoveis');
    window.scrollTo({ top: 0 });
  };

  const style = {
    ['--pc-bg' as any]: '#111111',
    ['--pc-fg' as any]: '#ffffff',
    ['--pc-accent' as any]: '#d9b45b',
    ['--pc-accent-strong' as any]: '#a9822c',
  } as React.CSSProperties;

  if (loading) {
    return (
      <div style={style} className="min-h-screen flex items-center justify-center bg-[var(--pc-bg)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--pc-accent)]" />
      </div>
    );
  }

  if (selected) {
    return (
      <div style={style}>
        <Header onNav={(s) => { setParams({}); setSection(s); }} currentSection={section} />
        <PropertyDetail property={selected} all={properties} onBack={back} onOpen={openProperty} />
        <Footer />
      </div>
    );
  }

  return (
    <div style={style} className="bg-[#fafaf5]">
      <Header onNav={(s) => { setSection(s); document.getElementById('lista')?.scrollIntoView({ behavior: 'smooth' }); }} currentSection={section} />
      <Hero cities={cities} types={types} onSearch={(f) => { setFilters(f); setSection('imoveis'); document.getElementById('lista')?.scrollIntoView({ behavior: 'smooth' }); }} />

      <main id="lista" className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h2 className="text-2xl font-light">
            {section === 'favoritos' ? 'Meus favoritos' : 'Imóveis disponíveis'}
            <span className="text-sm text-neutral-500 ml-2">({listed.length})</span>
          </h2>
          {(filters !== EMPTY_FILTERS && JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)) && (
            <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-sm underline text-[var(--pc-accent-strong)]">
              Limpar filtros
            </button>
          )}
        </div>

        {listed.length === 0 ? (
          <p className="text-center text-neutral-500 py-16">Nenhum imóvel encontrado com esses critérios.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {listed.map((p) => (
              <PropertyCard key={p.id} property={p} isFav={fav.has(p.id)} onFav={() => fav.toggle(p.id)} onOpen={() => openProperty(p.id)} />
            ))}
          </div>
        )}

        {section === 'sobre' && (
          <section className="mt-12 bg-white rounded p-6 shadow-sm max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold mb-2">Sobre o Portal Conectaê</h3>
            <p className="text-sm text-neutral-600">
              O Portal Conectaê reúne imóveis anunciados por profissionais parceiros da plataforma Conectaê Imob.
              Ao demonstrar interesse em um imóvel, seus dados são enviados diretamente ao parceiro responsável pelo anúncio,
              que entrará em contato com você.
            </p>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
