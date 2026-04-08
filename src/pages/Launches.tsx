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
  city: string;
  state: string | null;
  price_from: string | null;
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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    fetchLaunches();
  }, [user, authLoading]);

  const fetchLaunches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('launches')
      .select('id, name, banner_url, city, state, price_from, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) setLaunches(data);
    setLoading(false);
  };

  const cities = [...new Set(launches.map(l => l.city))].sort();

  const filtered = launches.filter(l => {
    const matchesSearch = !search || l.name.toLowerCase().includes(search.toLowerCase());
    const matchesCity = cityFilter === 'ALL' || l.city === cityFilter;
    return matchesSearch && matchesCity;
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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas as Cidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Cidades</SelectItem>
              {cities.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  {launch.banner_url ? (
                    <img
                      src={launch.banner_url}
                      alt={launch.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      Sem imagem
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-lg truncate">{launch.name}</h3>
                  {launch.price_from && (
                    <p className="text-primary font-medium mt-1">
                      {formatCurrency(launch.price_from)}
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
