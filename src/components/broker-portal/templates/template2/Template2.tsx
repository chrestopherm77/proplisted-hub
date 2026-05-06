import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TemplateProps, FilterState, EMPTY_FILTERS, applyFilters } from '../template1/types';
import { Header } from './Header';
import { Hero } from './Hero';
import { ExclusivesSection } from './ExclusivesSection';
import { PropertyCard } from './PropertyCard';
import { PropertyDetail } from '../template1/PropertyDetail';
import { AboutSection } from './AboutSection';
import { Testimonials, Testimonial } from './Testimonials';
import { CtaBanner } from './CtaBanner';
import { Footer } from './Footer';
import { WhatsAppFab } from '../template1/WhatsAppFab';
import { useFavorites } from '../template1/useFavorites';

export default function Template2({ portal, properties }: TemplateProps) {
  const b = portal.branding ?? {};
  const accent = b.accent_color || '#1e3a8a';
  const accentStrong = b.accent_color_strong || '#b91c1c';
  const bg = b.bg_color || '#1e3a8a';

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
  const visible = section === 'favoritos' ? properties.filter((p) => fav.has(p.id)) : filtered;

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
      className="min-h-screen bg-white"
      style={{
        ['--bp-accent' as any]: accent,
        ['--bp-accent-strong' as any]: accentStrong,
        ['--bp-bg' as any]: bg,
        ['--bp-fg' as any]: '#fff',
      }}
    >
      <Header portal={portal} onNav={handleNav} currentSection={section} />

      {openProperty ? (
        <PropertyDetail portal={portal} property={openProperty} all={properties} onBack={close} onOpen={open} />
      ) : (
        <>
          <Hero portal={portal} cities={cities} types={types} onSearch={(f) => { setFilters(f); setTimeout(() => document.getElementById('bp-imoveis')?.scrollIntoView({ behavior: 'smooth' }), 100); }} />

          <ExclusivesSection portal={portal} properties={properties} onOpen={open} />

          <main id="bp-imoveis" className="bg-neutral-50 py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-light text-center mb-8" style={{ color: 'var(--bp-accent)' }}>
                {section === 'favoritos' ? 'Meus Favoritos' : 'Imóveis em Destaque'}
              </h2>
              {visible.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Nenhum imóvel encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {visible.map((p) => (
                    <PropertyCard key={p.id} property={p} isFav={fav.has(p.id)} onFav={() => fav.toggle(p.id)} onOpen={() => open(p.id)} />
                  ))}
                </div>
              )}
            </div>
          </main>

          <AboutSection portal={portal} />

          {testimonials.length > 0 && <Testimonials items={testimonials} />}

          <CtaBanner portal={portal} onContact={() => handleNav('contato')} />

          <section id="bp-contato" className="bg-neutral-100 py-10">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-light mb-3">Entre em contato</h2>
              <p className="text-sm text-neutral-700">{b.address}</p>
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
