import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Search, Home, Building2, Store, TreePine, Landmark, Building, MessageCircle, MapPin, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface PropertySearch {
  id: string;
  user_id: string;
  title: string | null;
  headline: string | null;
  property_type: string;
  operation_type: string;
  city: string;
  state: string | null;
  neighborhood: string | null;
  zone: string | null;
  size_m2: string | null;
  bedrooms: string | null;
  value: string | null;
  parking_spots: string | null;
  observation: string | null;
  house_type: string | null;
  rural_type: string | null;
  is_active: boolean;
  offer_count: number;
  created_at: string;
}

interface MyOffer {
  id: string;
  search_id: string;
  created_at: string;
  search?: PropertySearch;
}

const propertyTypeLabels: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  SALA_COMERCIAL: 'Sala Comercial',
  LOTE: 'Lote',
  RURAL: 'Rural',
  PREDIO_COMERCIAL: 'Prédio Comercial',
};

const operationLabels: Record<string, string> = {
  VENDA: 'Venda',
  COMPRA: 'Compra',
  ALUGUEL: 'Aluguel',
};

const houseLabels: Record<string, string> = { RUA: 'Rua', CONDOMINIO: 'Condomínio' };
const ruralLabels: Record<string, string> = {
  FAZENDA: 'Fazenda',
  SITIO: 'Sítio',
  RANCHO: 'Rancho',
  CHACARA: 'Chácara',
};

const propertyTypeIcons: Record<string, React.ReactNode> = {
  CASA: <Home className="h-5 w-5" />,
  APARTAMENTO: <Building2 className="h-5 w-5" />,
  SALA_COMERCIAL: <Store className="h-5 w-5" />,
  LOTE: <Landmark className="h-5 w-5" />,
  RURAL: <TreePine className="h-5 w-5" />,
  PREDIO_COMERCIAL: <Building className="h-5 w-5" />,
};

const propertyTypeBadgeColors: Record<string, string> = {
  CASA: 'bg-blue-100 text-blue-800 border-blue-200',
  APARTAMENTO: 'bg-purple-100 text-purple-800 border-purple-200',
  SALA_COMERCIAL: 'bg-orange-100 text-orange-800 border-orange-200',
  LOTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RURAL: 'bg-green-100 text-green-800 border-green-200',
  PREDIO_COMERCIAL: 'bg-red-100 text-red-800 border-red-200',
};

const formatDisplayValue = (raw: string | null): string => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return `R$ ${num.toLocaleString('pt-BR')}`;
};

const buildDescription = (s: PropertySearch): string => {
  const parts: string[] = [];
  if (s.house_type) parts.push(houseLabels[s.house_type] ?? s.house_type);
  if (s.rural_type) parts.push(ruralLabels[s.rural_type] ?? s.rural_type);
  if (s.neighborhood) parts.push(`Bairro: ${s.neighborhood}`);
  if (s.zone) parts.push(`Zona: ${s.zone}`);
  if (s.bedrooms) parts.push(`${s.bedrooms} quartos`);
  if (s.size_m2) parts.push(`${s.size_m2} m²`);
  if (s.parking_spots) parts.push(`${s.parking_spots} vagas`);
  if (s.observation) parts.push(s.observation);
  return parts.join(' · ');
};

const PropertySearches = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searches, setSearches] = useState<PropertySearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [textFilter, setTextFilter] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterObjective, setFilterObjective] = useState('');
  const [filterNeighborhood, setFilterNeighborhood] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterModality, setFilterModality] = useState('');
  const [selectedSearch, setSelectedSearch] = useState<PropertySearch | null>(null);
  const [sendingOffer, setSendingOffer] = useState(false);
  const [myOffers, setMyOffers] = useState<MyOffer[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate('/auth'); return; }
      if (isAdmin === false) { navigate('/'); return; }
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user) {
      fetchSearches();
      fetchMyOffers();
    }
  }, [user]);

  const fetchSearches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('property_searches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) setSearches(data as unknown as PropertySearch[]);
    setLoading(false);
  };

  const fetchMyOffers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('property_search_offers')
      .select('id, search_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const searchIds = data.map(o => o.search_id);
      const { data: searchData } = await supabase
        .from('property_searches')
        .select('*')
        .in('id', searchIds);

      const searchMap = new Map((searchData ?? []).map(s => [s.id, s as unknown as PropertySearch]));
      setMyOffers(data.map(o => ({ ...o, search: searchMap.get(o.search_id) })));
    } else {
      setMyOffers([]);
    }
  };

  const handleSendOffer = async (search: PropertySearch) => {
    if (!user) return;
    setSendingOffer(true);

    // Increment offer count
    await supabase.rpc('increment_offer_count', { p_search_id: search.id });

    // Register offer
    await supabase.from('property_search_offers').upsert(
      { search_id: search.id, user_id: user.id },
      { onConflict: 'search_id,user_id' }
    );

    // Get owner phone
    const { data: phone } = await supabase.rpc('get_profile_phone', { p_user_id: search.user_id });

    if (!phone) {
      toast({ title: 'Erro', description: 'Não foi possível obter o contato do anunciante.', variant: 'destructive' });
      setSendingOffer(false);
      return;
    }

    const clean = (phone as string).replace(/\D/g, '');
    const fullPhone = clean.startsWith('55') ? clean : `55${clean}`;
    const msg = encodeURIComponent(
      `Olá! Vi sua procura de ${propertyTypeLabels[search.property_type] ?? search.property_type} em ${search.city} e gostaria de enviar uma oferta.`
    );
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');

    // Update local state
    setSearches(prev => prev.map(s => s.id === search.id ? { ...s, offer_count: (s.offer_count ?? 0) + 1 } : s));
    if (selectedSearch?.id === search.id) {
      setSelectedSearch(prev => prev ? { ...prev, offer_count: (prev.offer_count ?? 0) + 1 } : prev);
    }
    fetchMyOffers();
    setSendingOffer(false);
  };

  const uniqueCities = useMemo(() => [...new Set(searches.map((s) => s.city))].sort(), [searches]);
  const uniqueStates = useMemo(() => [...new Set(searches.map((s) => s.state).filter(Boolean) as string[])].sort(), [searches]);
  const uniqueTypes = useMemo(() => [...new Set(searches.map((s) => s.property_type))].sort(), [searches]);

  const filtered = searches.filter((s) => {
    const term = textFilter.toLowerCase();
    const matchesText =
      !term ||
      (s.title ?? '').toLowerCase().includes(term) ||
      (s.headline ?? '').toLowerCase().includes(term) ||
      (s.neighborhood ?? '').toLowerCase().includes(term) ||
      s.city.toLowerCase().includes(term) ||
      (propertyTypeLabels[s.property_type] ?? '').toLowerCase().includes(term);

    const matchesCity = !filterCity || s.city === filterCity;
    const matchesState = !filterState || s.state === filterState;
    const matchesType = !filterType || s.property_type === filterType;

    return matchesText && matchesCity && matchesState && matchesType;
  });

  if (authLoading || !user) return null;

  const modalDetails: { label: string; value: string | null }[] = selectedSearch ? [
    { label: 'Operação', value: operationLabels[selectedSearch.operation_type] ?? selectedSearch.operation_type },
    { label: 'Tipo', value: propertyTypeLabels[selectedSearch.property_type] ?? selectedSearch.property_type },
    ...(selectedSearch.house_type ? [{ label: 'Tipo de Casa', value: houseLabels[selectedSearch.house_type] ?? selectedSearch.house_type }] : []),
    ...(selectedSearch.rural_type ? [{ label: 'Tipo Rural', value: ruralLabels[selectedSearch.rural_type] ?? selectedSearch.rural_type }] : []),
    { label: 'Estado', value: selectedSearch.state },
    { label: 'Cidade', value: selectedSearch.city },
    { label: 'Bairro/Condomínio', value: selectedSearch.neighborhood },
    { label: 'Zona', value: selectedSearch.zone },
    { label: 'Tamanho (m²)', value: selectedSearch.size_m2 },
    { label: 'Quartos', value: selectedSearch.bedrooms },
    { label: 'Valor (R$)', value: selectedSearch.value ? formatDisplayValue(selectedSearch.value) : null },
    { label: 'Vagas de Garagem', value: selectedSearch.parking_spots },
    { label: 'Ofertas', value: String(selectedSearch.offer_count ?? 0) },
    { label: 'Data de Criação', value: format(new Date(selectedSearch.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) },
  ] : [];

  return (
    <Layout>
      <div className="relative max-w-7xl mx-auto">
        {/* Map background covering entire page content */}
        <div
          className="absolute inset-0 pointer-events-none opacity-55 dark:opacity-20 rounded-2xl"
          style={{
            backgroundImage: 'url(/images/map-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-background/10 pointer-events-none rounded-2xl" />

        <div className="relative z-10 space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="rounded-2xl border border-border/60 bg-background/70 px-5 py-5 backdrop-blur-[2px] sm:px-6 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Buscar Oferta</h1>
                <p className="text-muted-foreground text-sm mt-1">Veja pessoas procurando imóveis agora</p>
              </div>
              <Button onClick={() => navigate('/property-searches/new')} className="gap-2">
                <Plus className="h-4 w-4" /> Nova Procura
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, headline, bairro, cidade ou tipo..."
                className="pl-10 border-border/70 bg-background/90"
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select value={filterState} onValueChange={(v) => setFilterState(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="border-border/70 bg-background/90"><SelectValue placeholder="Filtrar por Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Estados</SelectItem>
                  {uniqueStates.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCity} onValueChange={(v) => setFilterCity(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="border-border/70 bg-background/90"><SelectValue placeholder="Filtrar por Cidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Cidades</SelectItem>
                  {uniqueCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(v) => setFilterType(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="border-border/70 bg-background/90"><SelectValue placeholder="Filtrar por Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  {uniqueTypes.map((t) => <SelectItem key={t} value={t}>{propertyTypeLabels[t] ?? t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards + Sidebar */}
          <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Cards list */}
            {loading ? (
              <p className="text-muted-foreground text-center py-12">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">Nenhuma procura encontrada.</p>
            ) : (
              <div className="space-y-4">
                {filtered.map((s) => {
                  const desc = buildDescription(s);
                  const displayValue = formatDisplayValue(s.value);
                  return (
                    <Card key={s.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            {/* Headline */}
                            <p className="font-semibold text-foreground text-base">
                              {s.headline || s.title || `${propertyTypeLabels[s.property_type] ?? s.property_type} para ${operationLabels[s.operation_type] ?? s.operation_type}`}
                            </p>
                            {/* Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                              <Badge variant="outline" className={`text-xs ${propertyTypeBadgeColors[s.property_type] ?? ''}`}>
                                {propertyTypeLabels[s.property_type] ?? s.property_type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {operationLabels[s.operation_type] ?? s.operation_type}
                              </Badge>
                            </div>
                            {/* Description */}
                            {desc && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{desc}</p>
                            )}
                          </div>
                          {/* Value + Location */}
                          <div className="text-right shrink-0 space-y-1">
                            {displayValue && (
                              <p className="font-bold text-foreground text-lg">{displayValue}</p>
                            )}
                            <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{s.city}{s.state ? ` / ${s.state}` : ''}</span>
                            </div>
                            <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                              <MessageCircle className="h-3 w-3" />
                              <span>{s.offer_count ?? 0} ofertas</span>
                            </div>
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setSelectedSearch(s)}
                          >
                            <Eye className="h-4 w-4" /> Ver detalhes
                          </Button>
                          {s.user_id !== user!.id && (
                            <Button
                              size="sm"
                              className="gap-2"
                              disabled={sendingOffer}
                              onClick={() => handleSendOffer(s)}
                            >
                              <MessageCircle className="h-4 w-4" /> Enviar Oferta
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar — Minhas Ofertas */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Minhas Ofertas</h2>
              {myOffers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma oferta enviada</p>
              ) : (
                <div className="space-y-3">
                  {myOffers.map((offer) => {
                    const s = offer.search;
                    if (!s) return null;
                    return (
                      <Card key={offer.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelectedSearch(s)}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="shrink-0 text-primary">
                              {propertyTypeIcons[s.property_type] ?? <Home className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {s.headline || s.title || propertyTypeLabels[s.property_type]}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {s.city}{s.state ? ` / ${s.state}` : ''}
                              </p>
                            </div>
                            {formatDisplayValue(s.value) && (
                              <span className="text-xs font-semibold text-foreground shrink-0">
                                {formatDisplayValue(s.value)}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedSearch} onOpenChange={(open) => { if (!open) setSelectedSearch(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedSearch && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedSearch.headline || selectedSearch.title || propertyTypeLabels[selectedSearch.property_type]}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-xs ${propertyTypeBadgeColors[selectedSearch.property_type] ?? ''}`}>
                      {propertyTypeLabels[selectedSearch.property_type] ?? selectedSearch.property_type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {operationLabels[selectedSearch.operation_type] ?? selectedSearch.operation_type}
                    </Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {modalDetails.map(
                  (d) =>
                    d.value && (
                      <div key={d.label}>
                        <p className="text-xs text-muted-foreground">{d.label}</p>
                        <p className="font-medium text-foreground text-sm">{d.value}</p>
                      </div>
                    )
                )}
              </div>
              {selectedSearch.observation && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Observação</p>
                  <p className="text-foreground text-sm">{selectedSearch.observation}</p>
                </div>
              )}
              {selectedSearch.user_id !== user!.id && (
                <Button
                  onClick={() => handleSendOffer(selectedSearch)}
                  disabled={sendingOffer}
                  className="w-full gap-2 mt-4"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5" />
                  {sendingOffer ? 'Enviando...' : 'Enviar Oferta'}
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PropertySearches;
