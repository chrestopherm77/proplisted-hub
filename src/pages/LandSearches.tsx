import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useLandSearches } from '@/hooks/useLandSearches';
import { Building2, MapPin, Mail, MessageCircle, Lock, Crown, Loader2, Search } from 'lucide-react';

const formatArea = (n: number | null) =>
  n == null ? '—' : `${Number(n).toLocaleString('pt-BR')} m²`;

export default function LandSearches() {
  const { items, loading, isPaid, isLoggedIn } = useLandSearches();
  const [filterState, setFilterState] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterMinArea, setFilterMinArea] = useState<string>('');

  const allStates = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.areas.forEach((a) => a.state && s.add(a.state)));
    return Array.from(s).sort();
  }, [items]);

  const allCities = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.areas.forEach((a) => {
      if ((filterState === 'all' || a.state === filterState) && a.city) s.add(a.city);
    }));
    return Array.from(s).sort();
  }, [items, filterState]);

  const filtered = useMemo(() => {
    const minArea = filterMinArea ? Number(filterMinArea.replace(/\D/g, '')) : null;
    return items.filter((i) => {
      if (filterCompany && !i.company_name.toLowerCase().includes(filterCompany.toLowerCase())) return false;
      if (minArea != null && (i.min_area_m2 ?? 0) > minArea) return false;
      if (filterState !== 'all' && !i.areas.some((a) => a.state === filterState)) return false;
      if (filterCity !== 'all' && !i.areas.some((a) => a.city === filterCity)) return false;
      return true;
    });
  }, [items, filterCompany, filterMinArea, filterState, filterCity]);

  const renderAreas = (areas: typeof items[number]['areas']) => {
    if (areas.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
    return (
      <div className="flex flex-col gap-1">
        {areas.map((a) => (
          <div key={a.id} className="flex items-start gap-1 text-xs">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
            <span>
              <span className="font-medium">{a.city}/{a.state}</span>
              {a.zone && <span className="text-muted-foreground"> · Zona {a.zone}</span>}
              {a.neighborhood && <span className="text-muted-foreground"> · {a.neighborhood}</span>}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const ContactCell = ({ item }: { item: typeof items[number] }) => {
    if (!isPaid) {
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="text-sm font-medium blur-sm select-none pointer-events-none">Contato Oculto</div>
            <div className="text-xs blur-sm select-none pointer-events-none">(11) 99999-9999</div>
            <div className="text-xs blur-sm select-none pointer-events-none">contato@empresa.com.br</div>
          </div>
          <Button asChild size="sm" className="w-full">
            <Link to="/planos">
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              {isLoggedIn ? 'Assine para ver' : 'Entrar e assinar'}
            </Link>
          </Button>
        </div>
      );
    }
    const wa = (item.contact_whatsapp || '').replace(/\D/g, '');
    return (
      <div className="space-y-1.5">
        <div className="text-sm font-medium">{item.contact_name}</div>
        <div className="flex flex-wrap gap-1.5">
          {wa && (
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
              </a>
            </Button>
          )}
          {item.contact_email && (
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <a href={`mailto:${item.contact_email}`}>
                <Mail className="h-3 w-3 mr-1" /> E-mail
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6" translate="no">
        {/* Hero */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="hidden md:flex h-12 w-12 rounded-lg bg-primary/10 items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">Procura-se de Terrenos</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Construtoras, incorporadoras e fundos de investimento divulgam aqui os terrenos
                que procuram comprar. Tem um terreno que pode interessar? Entre em contato direto.
              </p>
              {!isPaid && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Contatos liberados para assinantes dos planos pagos.</span>
                  <Link to="/planos" className="font-semibold underline">Ver planos</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Construtora/Incorporadora"
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterState} onValueChange={(v) => { setFilterState(v); setFilterCity('all'); }}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas UFs</SelectItem>
                {allStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas cidades</SelectItem>
                {allCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="Área mínima (m²)"
              type="number"
              value={filterMinArea}
              onChange={(e) => setFilterMinArea(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            Nenhum terreno procurado encontrado com os filtros atuais.
          </CardContent></Card>
        ) : (
          <>
            {/* Desktop: tabela */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Construtora / Incorporadora</TableHead>
                      <TableHead>Regiões de interesse</TableHead>
                      <TableHead className="w-32">Área mínima</TableHead>
                      <TableHead className="w-64">Contato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="align-top">
                          <div className="flex items-start gap-3">
                            {item.logo_url ? (
                              <img src={item.logo_url} alt={item.company_name} className="h-12 w-12 rounded-md object-contain border bg-muted shrink-0" />
                            ) : (
                              <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center shrink-0">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold">{item.company_name}</div>
                              {item.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.notes}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">{renderAreas(item.areas)}</TableCell>
                        <TableCell className="align-top">
                          <Badge variant="secondary">{formatArea(item.min_area_m2)}</Badge>
                        </TableCell>
                        <TableCell className="align-top"><ContactCell item={item} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile: cards */}
            <div className="grid gap-3 md:hidden">
              {filtered.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {item.logo_url ? (
                        <img src={item.logo_url} alt={item.company_name} className="h-12 w-12 rounded-md object-contain border bg-muted shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold">{item.company_name}</div>
                        <Badge variant="secondary" className="mt-1">{formatArea(item.min_area_m2)}</Badge>
                      </div>
                    </div>
                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    <div className="border-t pt-3">{renderAreas(item.areas)}</div>
                    <div className="border-t pt-3"><ContactCell item={item} /></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
