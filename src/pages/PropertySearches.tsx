import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Home, Building2, Store, TreePine, Landmark, Building } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PropertySearch {
  id: string;
  user_id: string;
  property_type: string;
  operation_type: string;
  city: string;
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

const PropertySearches = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searches, setSearches] = useState<PropertySearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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

    if (!error && data) setSearches(data as PropertySearch[]);
    setLoading(false);
  };

  const filtered = searches.filter((s) => {
    const term = filter.toLowerCase();
    return (
      !term ||
      (s.neighborhood ?? '').toLowerCase().includes(term) ||
      s.city.toLowerCase().includes(term) ||
      (propertyTypeLabels[s.property_type] ?? '').toLowerCase().includes(term)
    );
  });

  if (authLoading || !user) return null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Procura seu Imóvel</h1>
          <Button onClick={() => navigate('/property-searches/new')} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Procura
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por bairro, cidade ou tipo..."
            className="pl-10"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
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
                          {propertyTypeLabels[s.property_type] ?? s.property_type}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {operationLabels[s.operation_type] ?? s.operation_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Ativa
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {s.neighborhood ? `${s.neighborhood} — ` : ''}{s.city}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-foreground">{s.value ? `R$ ${s.value}` : '—'}</p>
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
