import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TemplateProps, FilterState, EMPTY_FILTERS, applyFilters } from './types';
import { Header } from './Header';
import { Hero } from './Hero';
import { PropertyCard } from './PropertyCard';
import { PropertyDetail } from './PropertyDetail';
import { Footer } from './Footer';
import { WhatsAppFab } from './WhatsAppFab';
import { useFavorites } from './useFavorites';
import { getPropertyTypeLabel } from '@/lib/propertyUtils';

export default function Template1({ portal, properties }: TemplateProps) {
  const b = portal.branding ?? {};
  const accent = b.accent_color || b.primary_color || '#c9a44c';
  const accentStrong = b.accent_color || b.primary_color || '#a8862f';
  const bg = b.bg_color || '#1c1c1c';

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
        ['--bp-fg' as any]: '#fff',
      }}
    >
      <Header portal={portal} onNav={handleNav} currentSection={section} />

      {openProperty ? (
        <PropertyDetail portal={portal} property={openProperty} all={properties} onBack={close} onOpen={open} />
      ) : (
        <>
          <Hero portal={portal} cities={cities} types={types} onSearch={(f) => { setFilters(f); setTimeout(() => document.getElementById('bp-imoveis')?.scrollIntoView({ behavior: 'smooth' }), 100); }} />

          <main id="bp-imoveis" className="bg-[#fafaf5] py-10">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-light text-center mb-6">{section === 'favoritos' ? 'Meus Favoritos' : 'Imóveis em destaque'}</h2>
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

          {(b.about_text || b.about_image_url) && (
            <section id="bp-sobre" className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
                  {b.about_image_url && (
                    <div className="w-full max-w-md mx-auto">
                      <div className="aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                        <img
                          src={b.about_image_url}
                          alt="Sobre nós"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: 'center top' }}
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <h2 className="text-3xl md:text-4xl font-light mb-4 text-neutral-900">Sobre nós</h2>
                    <div className="h-1 w-16 bg-[var(--bp-accent)] mb-5" />
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{b.about_text || b.about}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

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
