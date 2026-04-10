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
import { Plus, Search, Home, Building2, Store, TreePine, Landmark, Building, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PropertySearch {
  id: string;
  user_id: string;
  title: string | null;
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
  if (!raw) return '—';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '—';
  const num = parseInt(digits, 10);
  return `R$ ${num.toLocaleString('pt-BR')}`;
};

const PropertySearches = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searches, setSearches] = useState<PropertySearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [textFilter, setTextFilter] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate('/auth'); return; }
      if (isAdmin === false) { navigate('/'); return; }
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user) fetchSearches();
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

  // Extract unique values for filters
  const uniqueCities = useMemo(() => [...new Set(searches.map((s) => s.city))].sort(), [searches]);
  const uniqueStates = useMemo(() => [...new Set(searches.map((s) => s.state).filter(Boolean) as string[])].sort(), [searches]);
  const uniqueTypes = useMemo(() => [...new Set(searches.map((s) => s.property_type))].sort(), [searches]);

  const filtered = searches.filter((s) => {
    const term = textFilter.toLowerCase();
    const matchesText =
      !term ||
      (s.title ?? '').toLowerCase().includes(term) ||
      (s.neighborhood ?? '').toLowerCase().includes(term) ||
      s.city.toLowerCase().includes(term) ||
      (propertyTypeLabels[s.property_type] ?? '').toLowerCase().includes(term);

    const matchesCity = !filterCity || s.city === filterCity;
    const matchesState = !filterState || s.state === filterState;
    const matchesType = !filterType || s.property_type === filterType;

    return matchesText && matchesCity && matchesState && matchesType;
  });

  if (authLoading || !user) return null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Buscar Oferta</h1>
          <Button onClick={() => navigate('/property-searches/new')} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Procura
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, bairro, cidade ou tipo..."
              className="pl-10"
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={filterState} onValueChange={(v) => setFilterState(v === 'ALL' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Estados</SelectItem>
                {uniqueStates.map((st) => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCity} onValueChange={(v) => setFilterCity(v === 'ALL' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Cidades</SelectItem>
                {uniqueCities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(v) => setFilterType(v === 'ALL' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                {uniqueTypes.map((t) => (
                  <SelectItem key={t} value={t}>{propertyTypeLabels[t] ?? t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Nenhuma procura encontrada.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <Card
                key={s.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/property-searches/${s.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 text-primary">
                      {propertyTypeIcons[s.property_type] ?? <Home className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {s.title || propertyTypeLabels[s.property_type] || s.property_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <Badge variant="outline" className={`text-xs ${propertyTypeBadgeColors[s.property_type] ?? ''}`}>
                          {propertyTypeLabels[s.property_type] ?? s.property_type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {operationLabels[s.operation_type] ?? s.operation_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Ativa
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {s.neighborhood ? `${s.neighborhood} — ` : ''}{s.city}{s.state ? ` / ${s.state}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="font-semibold text-foreground">{formatDisplayValue(s.value)}</p>
                    <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                      <MessageCircle className="h-3 w-3" />
                      <span>{s.offer_count ?? 0} ofertas</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PropertySearches;
