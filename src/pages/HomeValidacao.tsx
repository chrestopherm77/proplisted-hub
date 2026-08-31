import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { HomeHeader } from '@/components/home-v2/HomeHeader';
import { HomeIntro } from '@/components/home-v2/HomeIntro';
import { HomeHero } from '@/components/home-v2/HomeHero';
import { PropertiesShowcase } from '@/components/home-v2/PropertiesShowcase';
import { ForBrokers } from '@/components/home-v2/ForBrokers';
import { NewsSection, NewsItem } from '@/components/home-v2/NewsSection';
import { HowItWorks } from '@/components/home-v2/HowItWorks';
import { HomeFaq } from '@/components/home-v2/HomeFaq';
import { FinalCta } from '@/components/home-v2/FinalCta';
import { HomeFooter } from '@/components/home-v2/HomeFooter';
import { PropertyDetail } from '@/components/portal-conectae/PropertyDetail';
import { useFavorites } from '@/components/portal-conectae/useFavorites';
import { EMPTY_FILTERS, FilterState } from '@/components/portal-conectae/types';

const PAGE_TITLE = 'Conectaê Imob | Imóveis à venda e para alugar com corretores parceiros';
const PAGE_DESC =
  'Encontre imóveis à venda e para alugar anunciados por corretores parceiros da Conectaê. Busque por cidade, tipo e valor e fale com quem entende do bairro.';

export default function HomeValidacao() {
  const [params, setParams] = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const fav = useFavorites();

  const selectedId = params.get('imovel');

  useEffect(() => {
    document.title = PAGE_TITLE;
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement('meta');
      m.setAttribute('name', 'description');
      document.head.appendChild(m);
    }
    m.setAttribute('content', PAGE_DESC);
  }, []);

  useEffect(() => {
    (async () => {
      const [props, posts] = await Promise.all([
        supabase.rpc('list_portal_conectae_properties' as any),
        supabase
          .from('news_posts')
          .select('id, title, image_url, created_at')
          .eq('is_active', true)
          .not('image_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6),
      ]);
      if (!props.error && props.data) setProperties(props.data as any[]);
      if (!posts.error && posts.data) setNews(posts.data as NewsItem[]);
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

  const jsonLd = useMemo(() => {
    if (!properties.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: properties.slice(0, 12).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'RealEstateListing',
          name: p.title || `Imóvel ref. ${p.reference_code}`,
          url: `${window.location.origin}/validacao?imovel=${p.id}`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: p.city,
            addressRegion: p.state,
          },
        },
      })),
    };
  }, [properties]);

  const openProperty = (id: string) => {
    setParams({ imovel: id });
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    setParams({});
    window.scrollTo({ top: 0 });
  };

  const selected = properties.find((p) => p.id === selectedId);

  const style = {
    ['--pc-bg' as any]: '#111111',
    ['--pc-fg' as any]: '#ffffff',
    ['--pc-accent' as any]: '#d9b45b',
    ['--pc-accent-strong' as any]: '#a9822c',
  } as React.CSSProperties;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selected) {
    return (
      <div style={style} translate="no">
        <HomeHeader />
        <div className="pt-16">
          <PropertyDetail property={selected} all={properties} onBack={back} onOpen={openProperty} />
        </div>
        <HomeFooter />
      </div>
    );
  }

  return (
    <div style={style} translate="no" className="min-h-screen bg-background text-foreground">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <HomeHeader />
      <main>
        <HomeIntro />
        <HomeHero
          cities={cities}
          types={types}
          onSearch={(f) => {
            setFilters(f);
            document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <PropertiesShowcase
          properties={properties}
          filters={filters}
          setFilters={setFilters}
          onOpen={openProperty}
          isFav={fav.has}
          onFav={fav.toggle}
        />
        <ForBrokers />
        <NewsSection news={news} />
        <HowItWorks />
        <HomeFaq />
        <FinalCta />
      </main>
      <HomeFooter />
    </div>
  );
}
