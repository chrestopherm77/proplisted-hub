import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useIBGELocation } from '@/hooks/useIBGELocation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Loader2, MapPin, ExternalLink } from 'lucide-react';

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  state: string;
  city: string;
  location_name: string | null;
  external_url: string;
  cover_image_url: string | null;
}

const stripAccent = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function Events() {
  const { user } = useAuth();
  const { states, cities, fetchCities, clearCities } = useIBGELocation();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [filterUf, setFilterUf] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('events' as any)
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true });
      setEvents((data as any as EventRow[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleUf = (v: string) => {
    setFilterUf(v);
    setFilterCity('');
    clearCities();
    if (v) fetchCities(v);
  };

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filterUf && e.state.toUpperCase() !== filterUf.toUpperCase()) return false;
      if (filterCity && stripAccent(e.city) !== stripAccent(filterCity)) return false;
      if (filterDate) {
        const d = new Date(e.event_date).toISOString().slice(0, 10);
        if (d < filterDate) return false;
      }
      return true;
    });
  }, [events, filterUf, filterCity, filterDate]);

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Faça login para acessar esta página.</p>
        </div>
      </Layout>
    );
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Eventos do Mercado Imobiliário
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Confira eventos selecionados e garanta sua participação direto com o organizador.
          </p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>UF</Label>
                <Select value={filterUf} onValueChange={handleUf}>
                  <SelectTrigger><SelectValue placeholder="Todas as UFs" /></SelectTrigger>
                  <SelectContent>
                    {states.map((s) => <SelectItem key={s.sigla} value={s.sigla}>{s.sigla}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select value={filterCity} onValueChange={setFilterCity} disabled={!filterUf}>
                  <SelectTrigger><SelectValue placeholder={filterUf ? 'Todas' : 'Selecione a UF'} /></SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>A partir de</Label>
                <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => { setFilterUf(''); setFilterCity(''); setFilterDate(''); clearCities(); }}
                  disabled={!filterUf && !filterCity && !filterDate}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum evento encontrado{filterUf || filterCity || filterDate ? ' com esses filtros' : ''}.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => (
              <Card key={e.id} className="overflow-hidden flex flex-col h-full">
                <div className="w-full h-44 bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {e.cover_image_url ? (
                    <img
                      src={e.cover_image_url}
                      alt={e.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <CalendarDays className="h-8 w-8 text-primary/40" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{e.title}</h3>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 shrink-0" /> {fmtDate(e.event_date)}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" /> {e.location_name ? `${e.location_name} — ` : ''}{e.city}/{e.state}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                    {e.description || ''}
                  </p>
                  <div className="pt-1 mt-auto">
                    <Button asChild size="sm" className="w-full">
                      <a href={e.external_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Acessar evento
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
