import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ArrowLeft, Loader2, Save, ChevronsUpDown, Check, Plus, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { PlanLimitDialog } from '@/components/plans/PlanLimitDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIBGELocation } from '@/hooks/useIBGELocation';
import { PropertyPhotosUpload } from '@/components/portal/PropertyPhotosUpload';
import { AmenitiesPicker, type CondoAmenitiesValue } from '@/components/portal/AmenitiesPicker';
import { PropertyFeaturesPicker, type PropertyFeaturesValue } from '@/components/portal/PropertyFeaturesPicker';
import { geocodeAndSaveProperty } from '@/lib/geocodeProperty';
import {
  PROPERTY_TYPES,
  OPERATION_TYPES,
  PROPERTY_STATUS,
  ZONE_OPTIONS,
  formatCurrencyInput,
  parseCurrencyInput,
  type PropertyPhoto,
} from '@/lib/propertyUtils';

const NewProperty = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  const { toast } = useToast();
  const { states, cities, fetchCities, loadingCities } = useIBGELocation();
  const { can, plan, loading: limitsLoading } = useSubscriptionLimits();
  const propertyGate = can('portal_properties');
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(isEditMode);
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);

  // Form fields
  const [propertyType, setPropertyType] = useState('');
  const [operationType, setOperationType] = useState('SALE');
  const [status, setStatus] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [suites, setSuites] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [parkingSpots, setParkingSpots] = useState('');
  const [areaUseful, setAreaUseful] = useState('');
  const [areaTotal, setAreaTotal] = useState('');
  const [priceSale, setPriceSale] = useState('');
  const [priceRent, setPriceRent] = useState('');
  const [condoFee, setCondoFee] = useState('');
  const [iptu, setIptu] = useState('');
  const [condoAmenities, setCondoAmenities] = useState<CondoAmenitiesValue>({});
  const [propertyFeatures, setPropertyFeatures] = useState<PropertyFeaturesValue>({});
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [acceptAffiliation, setAcceptAffiliation] = useState(true);

  // Bairros da cidade (OpenStreetMap via Overpass) + fallback com já cadastrados
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<string[]>([]);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate('/auth');
  }, [authLoading, user]);

  // Carrega dados existentes para edição
  useEffect(() => {
    if (!isEditMode || !user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', editId!)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        toast({ title: 'Imóvel não encontrado', variant: 'destructive' });
        navigate('/portal-imoveis');
        return;
      }
      if (data.user_id !== user.id) {
        toast({ title: 'Você não tem permissão para editar este imóvel', variant: 'destructive' });
        navigate(`/portal-imoveis/${editId}`);
        return;
      }

      const p: any = data;
      setPropertyType(p.property_type || '');
      setOperationType(p.operation_type || 'SALE');
      setStatus(p.status || '');
      setStateUf(p.state || '');
      setCity(p.city || '');
      setZone(p.zone || '');
      setNeighborhood(p.neighborhood || '');
      setAddress(p.address || '');
      setBedrooms(p.bedrooms != null ? String(p.bedrooms) : '');
      setSuites(p.suites != null ? String(p.suites) : '');
      setBathrooms(p.bathrooms != null ? String(p.bathrooms) : '');
      setParkingSpots(p.parking_spots != null ? String(p.parking_spots) : '');
      setAreaUseful(p.area_useful != null ? String(p.area_useful) : '');
      setAreaTotal(p.area_total != null ? String(p.area_total) : '');
      setPriceSale(p.price_sale != null ? formatCurrencyInput(String(Math.round(Number(p.price_sale) * 100))) : '');
      setPriceRent(p.price_rent != null ? formatCurrencyInput(String(Math.round(Number(p.price_rent) * 100))) : '');
      setCondoFee(p.condo_fee != null ? formatCurrencyInput(String(Math.round(Number(p.condo_fee) * 100))) : '');
      setIptu(p.iptu != null ? formatCurrencyInput(String(Math.round(Number(p.iptu) * 100))) : '');
      const am = p.amenities && typeof p.amenities === 'object' ? p.amenities : {};
      setCondoAmenities((am as any).condo || {});
      setPropertyFeatures((am as any).property || {});
      setAdditionalInfo(p.additional_info || '');
      setAcceptAffiliation(p.accept_affiliation !== false);
      setPhotos(Array.isArray(p.photos) ? (p.photos as PropertyPhoto[]) : []);
      setLoadingProperty(false);
    })();
    return () => { cancelled = true; };
  }, [isEditMode, editId, user]);

  useEffect(() => {
    if (stateUf) fetchCities(stateUf);
  }, [stateUf, fetchCities]);

  // Buscar bairros da cidade via Overpass API (OpenStreetMap)
  // Combina com bairros já cadastrados como fallback/complemento
  useEffect(() => {
    if (!city) {
      setNeighborhoodOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingNeighborhoods(true);

    (async () => {
      const collected = new Set<string>();

      // 1) Buscar bairros já cadastrados nesta cidade (fallback rápido e local)
      try {
        const query = supabase
          .from('properties')
          .select('neighborhood')
          .eq('city', city)
          .not('neighborhood', 'is', null)
          .limit(500);
        if (stateUf) query.eq('state', stateUf);
        const { data } = await query;
        (data || []).forEach((r: any) => {
          const n = (r.neighborhood || '').trim();
          if (n) collected.add(n);
        });
      } catch {
        /* ignora */
      }

      // 2) Buscar bairros via Overpass API (OpenStreetMap)
      // place=suburb / neighbourhood / quarter dentro do município
      try {
        const cityEsc = city.replace(/"/g, '\\"');
        const stateFilter = stateUf
          ? `["ISO3166-2"="BR-${stateUf}"]`
          : `["admin_level"="4"]["name"~"Brasil|Brazil",i]`;
        const overpassQuery = `
          [out:json][timeout:25];
          area${stateFilter}->.state;
          area["admin_level"="8"]["name"="${cityEsc}"](area.state)->.city;
          (
            node["place"~"^(suburb|neighbourhood|quarter|borough)$"](area.city);
            way["place"~"^(suburb|neighbourhood|quarter|borough)$"](area.city);
            relation["place"~"^(suburb|neighbourhood|quarter|borough)$"](area.city);
          );
          out tags;
        `.trim();

        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(overpassQuery),
        });
        if (res.ok) {
          const json = await res.json();
          (json.elements || []).forEach((el: any) => {
            const n = (el.tags?.name || '').trim();
            if (n) collected.add(n);
          });
        }
      } catch {
        /* ignora — usa apenas o fallback local */
      }

      if (cancelled) return;
      const unique = Array.from(collected).sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      );
      setNeighborhoodOptions(unique);
      setLoadingNeighborhoods(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [city, stateUf]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Limite só se aplica em criação
    if (!isEditMode && !propertyGate.allowed) {
      setShowLimitDialog(true);
      return;
    }

    if (!propertyType) {
      toast({ title: 'Selecione o tipo do imóvel', variant: 'destructive' });
      return;
    }
    if (!city) {
      toast({ title: 'Informe a cidade', variant: 'destructive' });
      return;
    }
    if ((operationType === 'SALE' || operationType === 'BOTH') && !priceSale) {
      toast({ title: 'Informe o preço de venda', variant: 'destructive' });
      return;
    }
    if ((operationType === 'RENT' || operationType === 'BOTH') && !priceRent) {
      toast({ title: 'Informe o valor do aluguel', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload: any = {
      property_type: propertyType,
      operation_type: operationType,
      status: status || null,
      state: stateUf || null,
      city,
      zone: zone || null,
      neighborhood: neighborhood || null,
      address: address || null,
      bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
      suites: suites ? parseInt(suites, 10) : null,
      bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
      parking_spots: parkingSpots ? parseInt(parkingSpots, 10) : null,
      area_useful: areaUseful ? parseFloat(areaUseful) : null,
      area_total: areaTotal ? parseFloat(areaTotal) : null,
      price_sale: parseCurrencyInput(priceSale),
      price_rent: parseCurrencyInput(priceRent),
      condo_fee: parseCurrencyInput(condoFee),
      iptu: parseCurrencyInput(iptu),
      amenities: { condo: condoAmenities, property: propertyFeatures },
      additional_info: additionalInfo || null,
      photos: photos as any,
      accept_affiliation: acceptAffiliation,
    };

    let savedId: string;
    if (isEditMode) {
      const { error } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', editId!)
        .eq('user_id', user.id);
      setSaving(false);
      if (error) {
        console.error(error);
        toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        return;
      }
      savedId = editId!;
      toast({ title: 'Imóvel atualizado!', description: 'As alterações foram publicadas.' });
    } else {
      payload.user_id = user.id;
      payload.is_active = true;
      const { data, error } = await supabase
        .from('properties')
        .insert(payload)
        .select('id')
        .single();
      setSaving(false);
      if (error || !data) {
        console.error(error);
        toast({ title: 'Erro ao salvar', description: error?.message, variant: 'destructive' });
        return;
      }
      savedId = data.id;
      toast({ title: 'Imóvel publicado!', description: 'Seu anúncio já está disponível.' });
    }

    // Geocode em background via fetch + keepalive — sobrevive ao navigate.
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (accessToken && supabaseUrl) {
        fetch(`${supabaseUrl}/functions/v1/geocode-properties`, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            apikey: anonKey,
          },
          body: JSON.stringify({ property_id: savedId }),
        }).catch((e) => console.warn('[geocode] fetch failed', e));
      }
    } catch (e) {
      console.warn('[geocode] dispatch error', e);
    }

    // Notificação em grupo apenas em criação
    if (!isEditMode) {
      try {
        supabase.functions.invoke('notify-property-group', { body: { propertyId: savedId } })
          .catch(err => console.error('notify-property-group error:', err));
      } catch {}
    }

    navigate(`/portal-imoveis/${savedId}`);
  };

  if (loadingProperty) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(isEditMode ? `/portal-imoveis/${editId}` : '/portal-imoveis')} className="mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6">{isEditMode ? 'Editar Imóvel' : 'Publicar Imóvel'}</h1>

        {!isEditMode && !limitsLoading && plan && (
          <Alert className={cn('mb-4', !propertyGate.allowed && 'border-destructive/50 bg-destructive/5')}>
            <Crown className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
              <span>
                Plano <strong>{plan.name}</strong>:{' '}
                {propertyGate.isUnlimited
                  ? `${propertyGate.used} imóveis publicados (ilimitado)`
                  : `${propertyGate.used} de ${propertyGate.limit} imóveis publicados`}
              </span>
              {!propertyGate.allowed && (
                <Button type="button" size="sm" variant="outline" onClick={() => navigate('/planos')}>
                  Fazer upgrade
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <PlanLimitDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          description={propertyGate.reason ?? 'Faça upgrade do seu plano para publicar mais imóveis.'}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Fotos</CardTitle></CardHeader>
            <CardContent>
              {user && (
                <PropertyPhotosUpload userId={user.id} photos={photos} onChange={setPhotos} max={30} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Informações principais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo do imóvel *</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Operação *</Label>
                  <Select value={operationType} onValueChange={setOperationType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPERATION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={stateUf} onValueChange={(v) => { setStateUf(v); setCity(''); setNeighborhood(''); }}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s.sigla} value={s.sigla}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cidade *</Label>
                  <Select value={city} onValueChange={(v) => { setCity(v); setNeighborhood(''); }} disabled={!stateUf || loadingCities}>
                    <SelectTrigger><SelectValue placeholder={stateUf ? 'Selecione a cidade' : 'Selecione um estado'} /></SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Zona</Label>
                  <Select value={zone} onValueChange={setZone}>
                    <SelectTrigger><SelectValue placeholder="Selecione a zona" /></SelectTrigger>
                    <SelectContent>
                      {ZONE_OPTIONS.map((z) => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Popover open={neighborhoodOpen} onOpenChange={setNeighborhoodOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={neighborhoodOpen}
                        disabled={!city}
                        className={cn('w-full justify-between font-normal', !neighborhood && 'text-muted-foreground')}
                      >
                        {neighborhood || (city ? 'Selecione ou digite o bairro' : 'Selecione a cidade primeiro')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 pointer-events-auto" align="start">
                      <Command
                        filter={(value, search) =>
                          value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                        }
                      >
                        <CommandInput
                          placeholder={loadingNeighborhoods ? 'Carregando bairros...' : 'Buscar bairro...'}
                          value={neighborhoodSearch}
                          onValueChange={setNeighborhoodSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {loadingNeighborhoods ? (
                              <span className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Carregando bairros...
                              </span>
                            ) : neighborhoodSearch.trim() ? (
                              <button
                                type="button"
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-sm"
                                onClick={() => {
                                  const v = neighborhoodSearch.trim();
                                  setNeighborhood(v);
                                  setNeighborhoodOptions((prev) =>
                                    prev.includes(v) ? prev : [...prev, v].sort((a, b) => a.localeCompare(b, 'pt-BR'))
                                  );
                                  setNeighborhoodOpen(false);
                                  setNeighborhoodSearch('');
                                }}
                              >
                                <Plus className="h-4 w-4" />
                                Adicionar "{neighborhoodSearch.trim()}"
                              </button>
                            ) : (
                              <span className="block py-3 text-center text-sm text-muted-foreground">
                                Nenhum bairro encontrado
                              </span>
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {neighborhoodOptions.map((n) => (
                              <CommandItem
                                key={n}
                                value={n}
                                onSelect={() => {
                                  setNeighborhood(n);
                                  setNeighborhoodOpen(false);
                                  setNeighborhoodSearch('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    neighborhood === n ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {n}
                              </CommandItem>
                            ))}
                            {neighborhoodSearch.trim() &&
                              !neighborhoodOptions.some(
                                (n) => n.toLowerCase() === neighborhoodSearch.trim().toLowerCase()
                              ) && (
                                <CommandItem
                                  value={`__add__${neighborhoodSearch}`}
                                  onSelect={() => {
                                    const v = neighborhoodSearch.trim();
                                    setNeighborhood(v);
                                    setNeighborhoodOptions((prev) =>
                                      prev.includes(v) ? prev : [...prev, v].sort((a, b) => a.localeCompare(b, 'pt-BR'))
                                    );
                                    setNeighborhoodOpen(false);
                                    setNeighborhoodSearch('');
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Adicionar "{neighborhoodSearch.trim()}"
                                </CommandItem>
                              )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Endereço (opcional)</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div>
                  <Label>Status do imóvel</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_STATUS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Características</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div><Label>Quartos</Label><Input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} /></div>
                <div><Label>Suítes</Label><Input type="number" min="0" value={suites} onChange={(e) => setSuites(e.target.value)} /></div>
                <div><Label>Banheiros</Label><Input type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} /></div>
                <div><Label>Vagas garagem</Label><Input type="number" min="0" value={parkingSpots} onChange={(e) => setParkingSpots(e.target.value)} /></div>
                <div><Label>Área útil (m²)</Label><Input type="number" min="0" step="0.01" value={areaUseful} onChange={(e) => setAreaUseful(e.target.value)} /></div>
                <div><Label>Área total (m²)</Label><Input type="number" min="0" step="0.01" value={areaTotal} onChange={(e) => setAreaTotal(e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Valores</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(operationType === 'SALE' || operationType === 'BOTH') && (
                  <div>
                    <Label>Preço de venda {operationType === 'SALE' && '*'}</Label>
                    <Input value={priceSale} onChange={(e) => setPriceSale(formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" />
                  </div>
                )}
                {(operationType === 'RENT' || operationType === 'BOTH') && (
                  <div>
                    <Label>Valor do aluguel {operationType === 'RENT' && '*'}</Label>
                    <Input value={priceRent} onChange={(e) => setPriceRent(formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" />
                  </div>
                )}
                <div>
                  <Label>Condomínio (Mensal)</Label>
                  <Input value={condoFee} onChange={(e) => setCondoFee(formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" />
                </div>
                <div>
                  <Label>IPTU (Anual)</Label>
                  <Input value={iptu} onChange={(e) => setIptu(formatCurrencyInput(e.target.value))} placeholder="R$ 0,00" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Comodidades do Condomínio</CardTitle></CardHeader>
            <CardContent>
              <AmenitiesPicker value={condoAmenities} onChange={setCondoAmenities} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Características do Imóvel</CardTitle></CardHeader>
            <CardContent>
              <PropertyFeaturesPicker value={propertyFeatures} onChange={setPropertyFeatures} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Informações adicionais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Detalhes do imóvel, diferenciais, condições especiais..."
                rows={5}
              />

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Aceitar afiliação</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Permite que outros corretores anunciem este imóvel com uma LP própria
                  </p>
                </div>
                <Switch checked={acceptAffiliation} onCheckedChange={setAcceptAffiliation} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(isEditMode ? `/portal-imoveis/${editId}` : '/portal-imoveis')}>Cancelar</Button>
            <Button type="submit" disabled={saving} size="lg">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditMode ? 'Salvar alterações' : 'Publicar imóvel'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewProperty;
