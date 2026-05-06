import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TemplateProps, FilterState, EMPTY_FILTERS, applyFilters } from '../template1/types';
import { Header } from './Header';
import { Hero } from './Hero';
import { FeaturedGrid } from './FeaturedGrid';
import { BuildOrBuySection } from './BuildOrBuySection';
import { AboutSection } from './AboutSection';
import { Testimonials, Testimonial } from '../template2/Testimonials';
import { CtaBanner } from './CtaBanner';
import { Footer } from './Footer';
import { PropertyDetail } from '../template1/PropertyDetail';
import { WhatsAppFab } from '../template1/WhatsAppFab';
import { useFavorites } from '../template1/useFavorites';

export default function Template3({ portal, properties }: TemplateProps) {
  const b = portal.branding ?? {};
  const accent = b.accent_color || '#5a6b3f';
  const accentStrong = b.accent_color_strong || '#8b6f3f';
  const bg = b.bg_color || '#5a6b3f';
  const bgLight = b.bg_color_light || '#f1ede4';

  const [section, setSection] = useState<string>('home');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [params, setParams] = useSearchParams();
  const fav = useFavorites(portal.slug);

  const openId = params.get('p');
  const openProperty = openId ? properties.find((p) => p.id === openId) : null;
  useEffect(() => { if (openProperty) window.scrollTo(0, 0); }, [openId]);

  const cities = useMemo(() => Array.from(new Set(properties.map((p) => p.city).filter(Boolean))).sort(), [properties]);
  const types = useMemo(() => Array.from(new Set(properties.map((p) => p.property_type).filter(Boolean))).sort(), [properties]);
  const filtered = useMemo(() => applyFilters(properties, filters), [properties, filters]);

  const sale = useMemo(() => filtered.filter((p) => p.operation_type === 'SALE' || p.operation_type === 'BOTH'), [filtered]);
  const rent = useMemo(() => filtered.filter((p) => p.operation_type === 'RENT' || p.operation_type === 'BOTH'), [filtered]);
  const favList = useMemo(() => properties.filter((p) => fav.has(p.id)), [properties, fav]);

  const testimonials: Testimonial[] = Array.isArray(b.testimonials) ? b.testimonials : [];

  const open = (id: string) => { params.set('p', id); setParams(params); };
  const close = () => { params.delete('p'); setParams(params); };

  const handleNav = (s: string) => {
    if (openProperty) close();
    setSection(s);
    if (s === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
    else {
      const el = document.getElementById(`bp-${s}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        ['--bp-accent' as any]: accent,
        ['--bp-accent-strong' as any]: accentStrong,
        ['--bp-bg' as any]: bg,
        ['--bp-bg-light' as any]: bgLight,
        ['--bp-fg' as any]: '#fff',
        background: bgLight,
      }}
    >
      <Header portal={portal} onNav={handleNav} currentSection={section} />

      {openProperty ? (
        <PropertyDetail portal={portal} property={openProperty} all={properties} onBack={close} onOpen={open} />
      ) : (
        <>
          <Hero portal={portal} cities={cities} types={types} onSearch={(f) => { setFilters(f); setTimeout(() => document.getElementById('bp-imoveis')?.scrollIntoView({ behavior: 'smooth' }), 100); }} />

          <div id="bp-imoveis">
            {section === 'favoritos' ? (
              <FeaturedGrid title="Meus Favoritos" properties={favList} fav={fav} onOpen={open} />
            ) : (
              <>
                <FeaturedGrid title="Imóveis em destaque - Venda" properties={sale} fav={fav} onOpen={open} />
                <FeaturedGrid title="Imóveis em destaque - Locação" properties={rent} fav={fav} onOpen={open} />
              </>
            )}
          </div>

          <BuildOrBuySection portal={portal} />

          <AboutSection portal={portal} />

          {testimonials.length > 0 && <Testimonials items={testimonials} />}

          <CtaBanner portal={portal} />

          <section id="bp-contato" className="py-10 bg-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-light mb-3" style={{ color: 'var(--bp-accent)' }}>Entre em contato</h2>
              {b.address && <p className="text-sm text-neutral-700">{b.address}</p>}
              {b.whatsapp && <p className="mt-2 font-semibold">WhatsApp: {b.whatsapp}</p>}
              {b.email && <p className="text-sm">{b.email}</p>}
            </div>
          </section>
        </>
      )}

      <Footer portal={portal} onNav={handleNav} />
      <WhatsAppFab phone={b.whatsapp} />
    </div>
  );
}
