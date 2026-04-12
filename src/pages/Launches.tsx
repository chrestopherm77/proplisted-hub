import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Loader2 } from 'lucide-react';

interface Launch {
  id: string;
  name: string;
  banner_url: string | null;
  logo_url: string | null;
  city: string;
  state: string | null;
  zone: string | null;
  price_from: string | null;
  price_max: string | null;
  property_type: string | null;
  size_m2_min: string | null;
  size_m2_max: string | null;
  status: string | null;
  is_active: boolean;
}

const formatCurrency = (raw: string | null): string => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return `R$ ${(num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

const Launches = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sizeMin, setSizeMin] = useState('');
  const [sizeMax, setSizeMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    if (isAdmin === false) { navigate('/'); return; }
    if (isAdmin) fetchLaunches();
  }, [user, authLoading, isAdmin]);

  const fetchLaunches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('launches')
      .select('id, name, banner_url, logo_url, city, state, zone, price_from, price_max, property_type, size_m2_min, size_m2_max, status, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) setLaunches(data);
    setLoading(false);
  };

  const cities = [...new Set(launches.map(l => l.city))].sort();
  const states = [...new Set(launches.map(l => l.state).filter(Boolean))].sort() as string[];
  const zones = [...new Set(launches.map(l => l.zone).filter(Boolean))].sort() as string[];

  const parseCurrency = (v: string) => {
    const d = v.replace(/\D/g, '');
    return d ? parseInt(d, 10) : 0;
  };

  const filtered = launches.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (cityFilter !== 'ALL' && l.city !== cityFilter) return false;
    if (stateFilter !== 'ALL' && l.state !== stateFilter) return false;
    if (zoneFilter !== 'ALL' && l.zone !== zoneFilter) return false;
    if (typeFilter !== 'ALL' && l.property_type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;

    if (sizeMin) {
      const min = parseInt(sizeMin, 10);
      const lMax = l.size_m2_max ? parseInt(l.size_m2_max, 10) : (l.size_m2_min ? parseInt(l.size_m2_min, 10) : 0);
      if (lMax < min) return false;
    }
    if (sizeMax) {
      const max = parseInt(sizeMax, 10);
      const lMin = l.size_m2_min ? parseInt(l.size_m2_min, 10) : 0;
      if (lMin > max) return false;
    }

    if (priceMin) {
      const min = parseCurrency(priceMin);
      const lMax = l.price_max ? parseCurrency(l.price_max) : (l.price_from ? parseCurrency(l.price_from) : 0);
      if (lMax < min) return false;
    }
    if (priceMax) {
      const max = parseCurrency(priceMax);
      const lMin = l.price_from ? parseCurrency(l.price_from) : 0;
      if (lMin > max) return false;
    }

    return true;
  });

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Lançamentos</h1>
          <Button onClick={() => navigate('/launches/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Estados</SelectItem>
              {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Cidades</SelectItem>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger><SelectValue placeholder="Zona" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Zonas</SelectItem>
              {zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Tipos</SelectItem>
              <SelectItem value="Casa">Casa</SelectItem>
              <SelectItem value="Apartamento">Apartamento</SelectItem>
              <SelectItem value="Terreno">Terreno</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="Lançamento">Lançamento</SelectItem>
              <SelectItem value="Em construção">Em construção</SelectItem>
              <SelectItem value="Entregue">Entregue</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input placeholder="m² mín" type="number" value={sizeMin} onChange={e => setSizeMin(e.target.value)} />
            <Input placeholder="m² máx" type="number" value={sizeMax} onChange={e => setSizeMax(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Input placeholder="Preço mín" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
            <Input placeholder="Preço máx" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Nenhum lançamento encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(launch => (
              <div
                key={launch.id}
                onClick={() => navigate(`/launches/${launch.id}`)}
                className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden relative">
                  {launch.banner_url ? (
                    <img src={launch.banner_url} alt={launch.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem imagem</div>
                  )}
                  {launch.logo_url && (
                    <img src={launch.logo_url} alt="Logo" className="absolute bottom-2 left-2 h-10 w-10 rounded-md bg-white object-contain shadow" />
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-semibold text-foreground text-lg truncate">{launch.name}</h3>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{launch.city}{launch.state ? `/${launch.state}` : ''}</span>
                    {launch.zone && <span>• {launch.zone}</span>}
                    {launch.status && <span>• {launch.status}</span>}
                    {launch.property_type && <span>• {launch.property_type}</span>}
                    {(launch.size_m2_min || launch.size_m2_max) && (
                      <span>• {launch.size_m2_min || '?'}–{launch.size_m2_max || '?'} m²</span>
                    )}
                  </div>
                  {(launch.price_from || launch.price_max) && (
                    <p className="text-primary font-medium text-sm mt-1">
                      {formatCurrency(launch.price_from)}{launch.price_max ? ` – ${formatCurrency(launch.price_max)}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Launches;
