import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Loader2, Building2, List, Map as MapIcon, X } from 'lucide-react';
import { PropertyCard } from '@/components/portal/PropertyCard';
import { PropertyMap } from '@/components/portal/PropertyMap';
import { useIBGELocation } from '@/hooks/useIBGELocation';
import { PROPERTY_TYPES, OPERATION_TYPES, ZONE_OPTIONS, formatCurrencyInput, parseCurrencyInput } from '@/lib/propertyUtils';


interface Property {
  id: string;
  user_id: string;
  reference_code: string;
  title: string | null;
  property_type: string;
  operation_type: string;
  city: string;
  state: string | null;
  neighborhood: string | null;
  zone?: string | null;
  bedrooms: number | null;
  parking_spots: number | null;
  area_useful: number | null;
  price_sale: number | null;
  price_rent: number | null;
  photos: unknown;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
}

const PortalImoveis = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [opFilter, setOpFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const { states, cities, fetchCities } = useIBGELocation();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProperties();
  }, [authLoading, user]);

  useEffect(() => {
    if (stateFilter && stateFilter !== 'ALL') {
      fetchCities(stateFilter);
    }
    setCityFilter('ALL');
  }, [stateFilter, fetchCities]);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setProperties(data as Property[]);
    setLoading(false);
  };

  const minNum = useMemo(() => parseCurrencyInput(priceMin), [priceMin]);
  const maxNum = useMemo(() => parseCurrencyInput(priceMax), [priceMax]);

  const hasAnyFilter =
    !!search ||
    typeFilter !== 'ALL' ||
    opFilter !== 'ALL' ||
    stateFilter !== 'ALL' ||
    cityFilter !== 'ALL' ||
    zoneFilter !== 'ALL' ||
    !!priceMin ||
    !!priceMax;

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setOpFilter('ALL');
    setStateFilter('ALL');
    setCityFilter('ALL');
    setZoneFilter('ALL');
    setPriceMin('');
    setPriceMax('');
  };

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (tab === 'mine' && p.user_id !== user?.id) return false;
      if (tab === 'all' && !p.is_active) return false;
      if (typeFilter !== 'ALL' && p.property_type !== typeFilter) return false;
      if (opFilter !== 'ALL' && p.operation_type !== opFilter) return false;
      if (stateFilter !== 'ALL' && p.state !== stateFilter) return false;
      if (cityFilter !== 'ALL' && p.city !== cityFilter) return false;
      if (zoneFilter !== 'ALL' && (p.zone || '') !== zoneFilter) return false;

      if (minNum != null || maxNum != null) {
        // Define o preço a comparar conforme a operação selecionada
        let price: number | null = null;
        if (opFilter === 'RENT') price = p.price_rent;
        else if (opFilter === 'SALE' || opFilter === 'BOTH') price = p.price_sale;
        else price = p.price_sale ?? p.price_rent;

        if (price == null) return false;
        if (minNum != null && price < minNum) return false;
        if (maxNum != null && price > maxNum) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.title || ''} ${p.reference_code} ${p.city} ${p.neighborhood || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [properties, tab, typeFilter, opFilter, stateFilter, cityFilter, zoneFilter, minNum, maxNum, search, user?.id]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Portal de Imóveis
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Publique seus imóveis e veja anúncios de outros corretores para revender
            </p>
          </div>
          <Button onClick={() => navigate('/portal-imoveis/novo')} size="lg">
            <Plus className="h-4 w-4" />
            Novo Anúncio
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'mine')}>
            <TabsList>
              <TabsTrigger value="all">Todos anúncios</TabsTrigger>
              <TabsTrigger value="mine">Meus anúncios</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="inline-flex rounded-md border bg-background p-0.5">
            <Button
              type="button"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
              Lista
            </Button>
            <Button
              type="button"
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => setViewMode('map')}
            >
              <MapIcon className="h-4 w-4" />
              Mapa
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, bairro, cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent className="z-[1100]">
              <SelectItem value="ALL">Todos os tipos</SelectItem>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={opFilter} onValueChange={setOpFilter}>
            <SelectTrigger><SelectValue placeholder="Operação" /></SelectTrigger>
            <SelectContent className="z-[1100]">
              <SelectItem value="ALL">Todas operações</SelectItem>
              {OPERATION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'map' ? (
          <PropertyMap properties={filtered} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum imóvel encontrado.</p>
            {tab === 'mine' && (
              <Button variant="link" onClick={() => navigate('/portal-imoveis/novo')}>
                Publicar meu primeiro imóvel
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PortalImoveis;
