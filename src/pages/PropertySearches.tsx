import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIBGELocation } from '@/hooks/useIBGELocation';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Home, Building2, Store, TreePine, Landmark, Building, MessageCircle, MapPin, Eye, Link2, Bell, ExternalLink, Trash2, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

interface OfferRecord {
  id: string;
  user_id: string;
  offer_name: string | null;
  offer_link: string | null;
  created_at: string | null;
}

interface SavedAlert {
  id: string;
  filters: Record<string, string>;
  created_at: string | null;
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

const zoneOptions = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro', 'Rural'];

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

const formatCurrencyInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
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

  // Offer modal state
  const [offerModalSearch, setOfferModalSearch] = useState<PropertySearch | null>(null);
  const [offerLink, setOfferLink] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  // Detail modal offers
  const [detailOffers, setDetailOffers] = useState<OfferRecord[]>([]);
  const [loadingDetailOffers, setLoadingDetailOffers] = useState(false);

  // Alert
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertState, setAlertState] = useState('');
  const [alertCity, setAlertCity] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertObjective, setAlertObjective] = useState('');
  const [alertZone, setAlertZone] = useState('');
  const [alertNeighborhood, setAlertNeighborhood] = useState('');
  const [alertPriceMin, setAlertPriceMin] = useState('');
  const [alertPriceMax, setAlertPriceMax] = useState('');
  const [alertCityComboboxOpen, setAlertCityComboboxOpen] = useState(false);

  // IBGE location for alert modal
  const { states: ibgeStates, cities: ibgeCities, loadingStates: ibgeLoadingStates, loadingCities: ibgeLoadingCities, fetchCities: ibgeFetchCities, clearCities: ibgeClearCities } = useIBGELocation();

  // Saved alerts
  const [savedAlerts, setSavedAlerts] = useState<SavedAlert[]>([]);
  const [showSavedAlerts, setShowSavedAlerts] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate('/auth'); return; }
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSearches();
      fetchMyOffers();
      fetchSavedAlerts();
    }
  }, [user]);

  // Load offers when detail modal opens — for ALL searches now
  useEffect(() => {
    if (selectedSearch) {
      fetchDetailOffers(selectedSearch.id);
    } else {
      setDetailOffers([]);
    }
  }, [selectedSearch]);

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

  const fetchDetailOffers = async (searchId: string) => {
    setLoadingDetailOffers(true);
    const { data } = await supabase
      .from('property_search_offers')
      .select('id, user_id, offer_name, offer_link, created_at')
      .eq('search_id', searchId)
      .order('created_at', { ascending: false });

    setDetailOffers((data ?? []) as OfferRecord[]);
    setLoadingDetailOffers(false);
  };

  const fetchSavedAlerts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('property_search_alerts')
      .select('id, filters, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    setSavedAlerts((data ?? []).map(a => ({ ...a, filters: (a.filters as Record<string, string>) ?? {} })));
  };

  const handleDeleteAlert = async (alertId: string) => {
    await supabase.from('property_search_alerts').delete().eq('id', alertId);
    setSavedAlerts(prev => prev.filter(a => a.id !== alertId));
    toast({ title: 'Alerta removido' });
  };

  const handleDeleteSearch = async (searchId: string) => {
    const { error } = await supabase.from('property_searches').delete().eq('id', searchId);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o interesse.', variant: 'destructive' });
      return;
    }
    setSearches(prev => prev.filter(s => s.id !== searchId));
    if (selectedSearch?.id === searchId) setSelectedSearch(null);
    toast({ title: 'Interesse excluído', description: 'Sua procura foi removida do Balcão.' });
  };

  const openOfferModal = (search: PropertySearch) => {
    setOfferModalSearch(search);
    setOfferLink('');
  };

  const handleWhatsAppOffer = async (search: PropertySearch) => {
    if (!user) return;
    setSendingOffer(true);

    await supabase.rpc('increment_offer_count', { p_search_id: search.id });

    const { data: myProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
    const myName = myProfile?.name ?? 'Corretor';

    await supabase.from('property_search_offers').upsert(
      { search_id: search.id, user_id: user.id, offer_name: myName } as any,
      { onConflict: 'search_id,user_id' }
    );

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

    setSearches(prev => prev.map(s => s.id === search.id ? { ...s, offer_count: (s.offer_count ?? 0) + 1 } : s));
    if (selectedSearch?.id === search.id) {
      setSelectedSearch(prev => prev ? { ...prev, offer_count: (prev.offer_count ?? 0) + 1 } : prev);
    }
    fetchMyOffers();
    setSendingOffer(false);
    setOfferModalSearch(null);
  };

  const handleSendLink = async () => {
    if (!offerModalSearch || !user || !offerLink.trim()) return;
    setSendingLink(true);

    const { data: myProfile } = await supabase.from('profiles').select('name, phone').eq('id', user.id).single();
    const myName = myProfile?.name ?? 'Corretor';
    const myPhone = myProfile?.phone ?? '';

    await supabase.rpc('increment_offer_count', { p_search_id: offerModalSearch.id });

    await supabase.from('property_search_offers').upsert(
      { search_id: offerModalSearch.id, user_id: user.id, offer_name: myName, offer_link: offerLink.trim() } as any,
      { onConflict: 'search_id,user_id' }
    );

    // Notify owner via WhatsApp
    try {
      const { data: notifyResult, error: notifyError } = await supabase.functions.invoke('notify-offer-whatsapp', {
        body: {
          searchId: offerModalSearch.id,
          offerUserName: myName,
          offerUserPhone: myPhone,
          offerLink: offerLink.trim(),
        },
      });
      if (notifyError) console.error('Offer notification error:', notifyError);
      else console.log('Offer notification result:', notifyResult);
    } catch (e) {
      console.error('Offer notification exception:', e);
    }

    setSearches(prev => prev.map(s => s.id === offerModalSearch.id ? { ...s, offer_count: (s.offer_count ?? 0) + 1 } : s));
    if (selectedSearch?.id === offerModalSearch.id) {
      setSelectedSearch(prev => prev ? { ...prev, offer_count: (prev.offer_count ?? 0) + 1 } : prev);
    }
    fetchMyOffers();
    setSendingLink(false);
    setOfferModalSearch(null);
    toast({ title: 'Oferta enviada!', description: 'Seu link foi registrado e o proprietário foi notificado.' });
  };

  const handleSaveAlert = async () => {
    if (!user) return;
    setSavingAlert(true);

    const filters: Record<string, string> = {};
    if (alertState) filters.state = alertState;
    if (alertCity) filters.city = alertCity;
    if (alertType) filters.property_type = alertType;
    if (alertObjective) filters.operation_type = alertObjective;
    if (alertNeighborhood) filters.neighborhood = alertNeighborhood;
    if (alertZone) filters.zone = alertZone;
    if (alertPriceMin) filters.priceMin = alertPriceMin;
    if (alertPriceMax) filters.priceMax = alertPriceMax;

    if (Object.keys(filters).length === 0) {
      toast({ title: 'Nenhum filtro preenchido', description: 'Selecione pelo menos um filtro antes de salvar o alerta.', variant: 'destructive' });
      setSavingAlert(false);
      return;
    }

    const { error } = await supabase.from('property_search_alerts').insert({
      user_id: user.id,
      filters,
    } as any);

    setSavingAlert(false);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar o alerta.', variant: 'destructive' });
    } else {
      toast({ title: 'Alerta salvo!', description: 'Você será notificado via WhatsApp quando uma nova procura compatível for publicada.' });
      setAlertModalOpen(false);
      resetAlertForm();
      fetchSavedAlerts();
    }
  };

  // Fetch IBGE cities when alert state changes
  useEffect(() => {
    if (alertState) {
      ibgeFetchCities(alertState);
    } else {
      ibgeClearCities();
    }
  }, [alertState, ibgeFetchCities, ibgeClearCities]);

  const handleAlertStateChange = (newState: string) => {
    setAlertState(newState === 'ALL' ? '' : newState);
    setAlertCity('');
  };

  const resetAlertForm = () => {
    setAlertState('');
    setAlertCity('');
    setAlertType('');
    setAlertObjective('');
    setAlertZone('');
    setAlertNeighborhood('');
    setAlertPriceMin('');
    setAlertPriceMax('');
  };

  const uniqueCities = useMemo(() => [...new Set(searches.map((s) => s.city))].sort(), [searches]);
  const uniqueStates = useMemo(() => [...new Set(searches.map((s) => s.state).filter(Boolean) as string[])].sort(), [searches]);
  const uniqueTypes = useMemo(() => [...new Set(searches.map((s) => s.property_type))].sort(), [searches]);

  const parseNumericValue = (val: string | null): number => {
    if (!val) return 0;
    const digits = val.replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };

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

    const matchesObjective = !filterObjective || s.operation_type === filterObjective;
    const matchesNeighborhood = !filterNeighborhood || (s.neighborhood ?? '').toLowerCase().includes(filterNeighborhood.toLowerCase());
    const matchesZone = !filterZone || (s.zone ?? '').toLowerCase().includes(filterZone.toLowerCase());

    const numericValue = parseNumericValue(s.value);
    const minPrice = filterPriceMin ? parseInt(filterPriceMin.replace(/\D/g, ''), 10) : 0;
    const maxPrice = filterPriceMax ? parseInt(filterPriceMax.replace(/\D/g, ''), 10) : 0;
    const matchesPriceMin = !minPrice || numericValue >= minPrice;
    const matchesPriceMax = !maxPrice || numericValue <= maxPrice;

    const matchesModality = !filterModality || 
      (s.observation ?? '').toLowerCase().includes(filterModality.toLowerCase()) ||
      (s.headline ?? '').toLowerCase().includes(filterModality.toLowerCase());

    return matchesText && matchesCity && matchesState && matchesType && matchesObjective && matchesNeighborhood && matchesZone && matchesPriceMin && matchesPriceMax && matchesModality;
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

  const buildAlertDescription = (filters: Record<string, string>): string => {
    const parts: string[] = [];
    if (filters.state) parts.push(filters.state);
    if (filters.city) parts.push(filters.city);
    if (filters.property_type) parts.push(propertyTypeLabels[filters.property_type] ?? filters.property_type);
    if (filters.operation_type) parts.push(operationLabels[filters.operation_type] ?? filters.operation_type);
    if (filters.zone) parts.push(`Zona ${filters.zone}`);
    if (filters.neighborhood) parts.push(filters.neighborhood);
    if (filters.priceMin) parts.push(`Min ${formatDisplayValue(filters.priceMin)}`);
    if (filters.priceMax) parts.push(`Max ${formatDisplayValue(filters.priceMax)}`);
    return parts.join(' · ') || 'Sem filtros';
  };

  return (
    <Layout>
      <div className="relative max-w-7xl mx-auto">
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
                <h1 className="text-2xl font-bold text-foreground">Central de Demandas</h1>
                <p className="text-muted-foreground text-sm mt-1">Conecte-se com quem tem o imóvel ideal. Compartilhe o que o seu cliente busca e deixe que os parceiros tragam as oportunidades até você.</p>
              </div>
              <Button onClick={() => navigate('/property-searches/new')} className="gap-2">
                <Plus className="h-4 w-4" /> Interesse do Cliente
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select value={filterObjective} onValueChange={(v) => setFilterObjective(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="border-border/70 bg-background/90"><SelectValue placeholder="Objetivo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Objetivos</SelectItem>
                  <SelectItem value="COMPRA">Comprar</SelectItem>
                  <SelectItem value="VENDA">Vender</SelectItem>
                  <SelectItem value="ALUGUEL">Alugar</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Filtrar por Bairro"
                className="border-border/70 bg-background/90"
                value={filterNeighborhood}
                onChange={(e) => setFilterNeighborhood(e.target.value)}
              />
              <Select value={filterZone} onValueChange={(v) => setFilterZone(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="border-border/70 bg-background/90"><SelectValue placeholder="Filtrar por Zona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Zonas</SelectItem>
                  {zoneOptions.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                placeholder="Preço mínimo (R$)"
                className="border-border/70 bg-background/90"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(formatCurrencyInput(e.target.value))}
              />
              <Input
                placeholder="Preço máximo (R$)"
                className="border-border/70 bg-background/90"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(formatCurrencyInput(e.target.value))}
              />
              <Select value={filterModality} onValueChange={(v) => setFilterModality(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="border-border/70 bg-background/90"><SelectValue placeholder="Modalidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Modalidades</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Save Alert + My Saved Alerts */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setAlertModalOpen(true)}
              >
                <Bell className="h-4 w-4" />
                Salvar filtro como Alerta
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setShowSavedAlerts(!showSavedAlerts)}
              >
                <Bell className="h-4 w-4" />
                Meus Alertas ({savedAlerts.length})
              </Button>
            </div>

            {/* Saved Alerts List */}
            {showSavedAlerts && savedAlerts.length > 0 && (
              <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-background/80">
                <h3 className="text-sm font-semibold text-foreground">Meus Alertas Salvos</h3>
                {savedAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 border border-border/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{buildAlertDescription(alert.filters)}</p>
                      {alert.created_at && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(alert.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {showSavedAlerts && savedAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground p-3">Nenhum alerta salvo.</p>
            )}
          </div>

          {/* Cards + Sidebar */}
          <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 space-y-6">
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
                            <p className="font-semibold text-foreground text-base">
                              {s.headline || s.title || `${propertyTypeLabels[s.property_type] ?? s.property_type} para ${operationLabels[s.operation_type] ?? s.operation_type}`}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                              <Badge variant="outline" className={`text-xs ${propertyTypeBadgeColors[s.property_type] ?? ''}`}>
                                {propertyTypeLabels[s.property_type] ?? s.property_type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {operationLabels[s.operation_type] ?? s.operation_type}
                              </Badge>
                            </div>
                            {desc && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{desc}</p>
                            )}
                          </div>
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
                              onClick={() => openOfferModal(s)}
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

              {/* Ofertas Recebidas — visible to ALL users */}
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Ofertas Recebidas</h3>
                {loadingDetailOffers ? (
                  <p className="text-xs text-muted-foreground">Carregando...</p>
                ) : detailOffers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma oferta recebida ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {detailOffers.map((offer) => (
                      <div key={offer.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 border border-border/50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {offer.offer_name ?? 'Corretor'}
                          </p>
                          {offer.created_at && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(offer.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        {offer.offer_link && (
                          <a
                            href={offer.offer_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-primary hover:text-primary/80 flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Ver anúncio
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedSearch.user_id !== user!.id && (
                <Button
                  onClick={() => { setSelectedSearch(null); openOfferModal(selectedSearch); }}
                  disabled={sendingOffer}
                  className="w-full gap-2 mt-4"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5" />
                  Enviar Oferta
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Offer Modal */}
      <Dialog open={!!offerModalSearch} onOpenChange={(open) => { if (!open) setOfferModalSearch(null); }}>
        <DialogContent className="max-w-md">
          {offerModalSearch && (
            <>
              <DialogHeader>
                <DialogTitle>Enviar Oferta</DialogTitle>
                <DialogDescription>
                  {offerModalSearch.headline || offerModalSearch.title || `${propertyTypeLabels[offerModalSearch.property_type]} em ${offerModalSearch.city}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Link option */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Link do seu anúncio</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://..."
                        className="pl-9"
                        value={offerLink}
                        onChange={(e) => setOfferLink(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={sendingLink || !offerLink.trim()}
                    onClick={handleSendLink}
                  >
                    <Link2 className="h-4 w-4" />
                    {sendingLink ? 'Enviando...' : 'Enviar Link'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Modal */}
      <Dialog open={alertModalOpen} onOpenChange={setAlertModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Alerta</DialogTitle>
            <DialogDescription>
              Defina os filtros e você será notificado via WhatsApp quando uma nova procura compatível for publicada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <Select value={alertState} onValueChange={handleAlertStateChange}>
              <SelectTrigger><SelectValue placeholder={ibgeLoadingStates ? "Carregando..." : "Estado"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {ibgeStates.map((st) => <SelectItem key={st.id} value={st.sigla}>{st.nome} ({st.sigla})</SelectItem>)}
              </SelectContent>
            </Select>

            <Popover open={alertCityComboboxOpen} onOpenChange={setAlertCityComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between font-normal")}
                  disabled={!alertState || ibgeLoadingCities}
                >
                  {ibgeLoadingCities ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Carregando...</span>
                  ) : alertCity ? (
                    alertCity
                  ) : (
                    <span className="text-muted-foreground">{!alertState ? "Selecione o estado" : "Buscar cidade..."}</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 pointer-events-auto" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cidade..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                    <CommandGroup>
                      {ibgeCities.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.nome}
                          onSelect={() => { setAlertCity(c.nome); setAlertCityComboboxOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", alertCity === c.nome ? "opacity-100" : "opacity-0")} />
                          {c.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Select value={alertType} onValueChange={(v) => setAlertType(v === 'ALL' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Tipo de Imóvel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {Object.entries(propertyTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={alertObjective} onValueChange={(v) => setAlertObjective(v === 'ALL' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Objetivo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="COMPRA">Comprar</SelectItem>
                <SelectItem value="VENDA">Vender</SelectItem>
                <SelectItem value="ALUGUEL">Alugar</SelectItem>
              </SelectContent>
            </Select>

            <Select value={alertZone} onValueChange={(v) => setAlertZone(v === 'ALL' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Zona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {zoneOptions.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input
              placeholder="Bairro (opcional)"
              value={alertNeighborhood}
              onChange={(e) => setAlertNeighborhood(e.target.value)}
            />

            <Input
              placeholder="Valor mínimo (R$)"
              value={alertPriceMin}
              onChange={(e) => setAlertPriceMin(formatCurrencyInput(e.target.value))}
            />

            <Input
              placeholder="Valor máximo (R$)"
              value={alertPriceMax}
              onChange={(e) => setAlertPriceMax(formatCurrencyInput(e.target.value))}
            />

            <Button
              className="w-full gap-2"
              disabled={savingAlert}
              onClick={handleSaveAlert}
            >
              <Bell className="h-4 w-4" />
              {savingAlert ? 'Salvando...' : 'Salvar Alerta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PropertySearches;
