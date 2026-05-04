import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Loader2, Bell, BellOff, Trash2, Save, Megaphone, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildWaLink } from '@/lib/whatsapp';

interface Launch {
  id: string;
  user_id: string | null;
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

interface LaunchAlert {
  id: string;
  filters: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

const formatCurrency = (raw: string | null): string => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return `R$ ${(num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

const handlePriceMask = (value: string): string => {
  const v = value.replace(/\D/g, '');
  if (!v) return '';
  const num = parseInt(v, 10);
  return `R$ ${(num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

const ZONE_OPTIONS = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro', 'Rural'];

const Launches = () => {
  const { user, loading: authLoading, isAdmin, isConstrutora, canPublishLaunches } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  // Alerts
  const [alerts, setAlerts] = useState<LaunchAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    fetchLaunches();
    fetchAlerts();
  }, [user, authLoading]);

  const fetchLaunches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('launches')
      .select('id, user_id, name, banner_url, logo_url, city, state, zone, price_from, price_max, property_type, size_m2_min, size_m2_max, status, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (!error && data) setLaunches(data);
    setLoading(false);
  };

  const fetchAlerts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('launch_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setAlerts(data as unknown as LaunchAlert[]);
  };

  const saveAlert = async () => {
    if (!user) return;
    setSavingAlert(true);
    const filters: Record<string, string> = {};
    if (stateFilter !== 'ALL') filters.state = stateFilter;
    if (cityFilter !== 'ALL') filters.city = cityFilter;
    if (zoneFilter !== 'ALL') filters.zone = zoneFilter;
    if (typeFilter !== 'ALL') filters.property_type = typeFilter;
    if (statusFilter !== 'ALL') filters.status = statusFilter;
    if (priceMin) filters.priceMin = priceMin;
    if (priceMax) filters.priceMax = priceMax;

    if (Object.keys(filters).length === 0) {
      toast({ title: 'Selecione ao menos um filtro para salvar o alerta', variant: 'destructive' });
      setSavingAlert(false);
      return;
    }

    const { error } = await supabase.from('launch_alerts').insert({
      user_id: user.id,
      filters,
    } as any);

    if (error) {
      toast({ title: 'Erro ao salvar alerta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Alerta salvo! Você será notificado quando novos lançamentos compatíveis forem publicados.' });
      fetchAlerts();
    }
    setSavingAlert(false);
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase.from('launch_alerts').delete().eq('id', id);
    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Alerta removido' });
    }
  };

  const cities = [...new Set(launches.map(l => l.city))].sort();
  const states = [...new Set(launches.map(l => l.state).filter(Boolean))].sort() as string[];

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

  const formatAlertFilters = (f: Record<string, string>) => {
    const parts: string[] = [];
    if (f.state) parts.push(f.state);
    if (f.city) parts.push(f.city);
    if (f.zone) parts.push(f.zone);
    if (f.property_type) parts.push(f.property_type);
    if (f.status) parts.push(f.status);
    if (f.priceMin) parts.push(`Min: ${formatCurrency(f.priceMin) || f.priceMin}`);
    if (f.priceMax) parts.push(`Max: ${formatCurrency(f.priceMax) || f.priceMax}`);
    return parts.join(' • ') || 'Sem filtros';
  };

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
          <div className="flex gap-2">
            <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Meus Alertas {alerts.length > 0 && `(${alerts.length})`}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Meus Alertas de Lançamentos</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhum alerta salvo.</p>
                  ) : (
                    alerts.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{formatAlertFilters(a.filters)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteAlert(a.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
            {canPublishLaunches ? (
              <Button onClick={() => navigate('/launches/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                Publicar novo lançamento
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const url = buildWaLink('5516992456258', 'Vim do site da Conectae e quero criar um novo lançamento');
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Quero publicar lançamento
              </Button>
            )}
          </div>
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
              {ZONE_OPTIONS.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
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
            <Input
              placeholder="Preço mín"
              value={priceMin}
              onChange={e => setPriceMin(handlePriceMask(e.target.value))}
            />
            <Input
              placeholder="Preço máx"
              value={priceMax}
              onChange={e => setPriceMax(handlePriceMask(e.target.value))}
            />
          </div>
        </div>

        {/* Save Alert Button */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="gap-2" onClick={saveAlert} disabled={savingAlert}>
            {savingAlert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alerta com Filtros Atuais
          </Button>
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
                className="bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer relative"
              >
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  {(isAdmin || (user && launch.user_id === user.id)) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 shadow"
                      title="Editar lançamento"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/launches/${launch.id}/edit`);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 shadow"
                      title="Disparar lançamento no grupo do WhatsApp"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const { data, error } = await supabase.functions.invoke('notify-launch-group', {
                            body: { launchId: launch.id },
                          });
                          if (error || (data && (data as any).error)) {
                            const msg = (data as any)?.error || error?.message || 'Erro desconhecido';
                            throw new Error(msg);
                          }
                          if ((data as any)?.skipped) {
                            toast({ title: 'Cidade sem grupo mapeado', description: 'Nenhum grupo configurado para esta cidade/UF.' });
                          } else {
                            toast({ title: '✅ Lançamento enviado ao grupo WhatsApp!' });
                          }
                        } catch (err: any) {
                          const msg: string = err?.message || '';
                          const isMegaDown = msg.includes('tentativas') || msg.includes('instável') || msg.includes('WhatsApp');
                          toast({
                            title: 'Falha ao disparar no grupo',
                            description: isMegaDown
                              ? 'A API do WhatsApp está retornando erro. Tente novamente em alguns minutos.'
                              : (msg || 'Erro desconhecido'),
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <Megaphone className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="aspect-[16/10] bg-white overflow-hidden relative flex items-center justify-center">
                  {launch.banner_url ? (
                    <img src={launch.banner_url} alt={launch.name} className="w-full h-full object-contain" />
                  ) : launch.logo_url ? (
                    <img src={launch.logo_url} alt={launch.name} className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem imagem</div>
                  )}
                  {launch.banner_url && launch.logo_url && (
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
