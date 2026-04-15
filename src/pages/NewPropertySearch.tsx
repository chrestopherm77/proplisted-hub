import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Home, Building2, Store, Landmark, TreePine, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIBGELocation } from '@/hooks/useIBGELocation';

type PropertyType = 'CASA' | 'APARTAMENTO' | 'SALA_COMERCIAL' | 'LOTE' | 'RURAL' | 'PREDIO_COMERCIAL';

interface TypeOption {
  type: PropertyType;
  label: string;
  icon: React.ReactNode;
}

const typeOptions: TypeOption[] = [
  { type: 'CASA', label: 'Casa', icon: <Home className="h-8 w-8" /> },
  { type: 'APARTAMENTO', label: 'Apartamento', icon: <Building2 className="h-8 w-8" /> },
  { type: 'SALA_COMERCIAL', label: 'Sala Comercial', icon: <Store className="h-8 w-8" /> },
  { type: 'LOTE', label: 'Lote', icon: <Landmark className="h-8 w-8" /> },
  { type: 'RURAL', label: 'Rural', icon: <TreePine className="h-8 w-8" /> },
  { type: 'PREDIO_COMERCIAL', label: 'Prédio Comercial', icon: <Building className="h-8 w-8" /> },
];

interface FieldConfig {
  hasHouseType: boolean;
  hasParking: boolean;
  hasBedrooms: boolean;
  hasRuralType: boolean;
  operationOptions: string[];
}

const fieldConfigs: Record<PropertyType, FieldConfig> = {
  CASA: { hasHouseType: true, hasParking: true, hasBedrooms: true, hasRuralType: false, operationOptions: ['VENDA', 'COMPRA'] },
  APARTAMENTO: { hasHouseType: false, hasParking: true, hasBedrooms: true, hasRuralType: false, operationOptions: ['VENDA', 'COMPRA', 'ALUGUEL'] },
  SALA_COMERCIAL: { hasHouseType: false, hasParking: true, hasBedrooms: false, hasRuralType: false, operationOptions: ['VENDA', 'ALUGUEL'] },
  LOTE: { hasHouseType: false, hasParking: false, hasBedrooms: false, hasRuralType: false, operationOptions: ['VENDA', 'ALUGUEL'] },
  RURAL: { hasHouseType: false, hasParking: false, hasBedrooms: false, hasRuralType: true, operationOptions: ['VENDA', 'ALUGUEL'] },
  PREDIO_COMERCIAL: { hasHouseType: false, hasParking: true, hasBedrooms: false, hasRuralType: false, operationOptions: ['VENDA', 'ALUGUEL'] },
};

const opLabels: Record<string, string> = { VENDA: 'Venda', COMPRA: 'Compra', ALUGUEL: 'Aluguel' };
const houseTypeLabels: Record<string, string> = { RUA: 'Rua', CONDOMINIO: 'Condomínio' };
const ruralTypeLabels: Record<string, string> = { FAZENDA: 'Fazenda', SITIO: 'Sítio', RANCHO: 'Rancho', CHACARA: 'Chácara' };
const zoneOptions = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro', 'Rural'];

const formatCurrency = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (num > 1000000000) return formatCurrency(digits.slice(0, -1));
  return num.toLocaleString('pt-BR');
};

const NewPropertySearch = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { states, cities, loadingStates, loadingCities, fetchCities, clearCities } = useIBGELocation();

  const [selected, setSelected] = useState<TypeOption | null>(null);
  const [saving, setSaving] = useState(false);

  // form fields
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [operationType, setOperationType] = useState('');
  const [houseType, setHouseType] = useState('');
  const [ruralType, setRuralType] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zone, setZone] = useState('');
  const [sizeM2, setSizeM2] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [parkingSpots, setParkingSpots] = useState('');
  const [observation, setObservation] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate('/auth'); return; }
      if (isAdmin === false) { navigate('/'); return; }
    }
  }, [user, authLoading, isAdmin, navigate]);

  const handleStateChange = (uf: string) => {
    setState(uf);
    setCity('');
    if (uf) {
      fetchCities(uf);
    } else {
      clearCities();
    }
  };

  const generatedTitle = useMemo(() => {
    if (!selected) return '';
    const parts: string[] = [];
    parts.push(selected.label);
    if (selected.type === 'CASA' && houseType) parts.push(houseTypeLabels[houseType] || houseType);
    if (selected.type === 'RURAL' && ruralType) parts.push(ruralTypeLabels[ruralType] || ruralType);
    if (operationType) parts.push(opLabels[operationType] || operationType);
    if (city && state) parts.push(`${city}/${state}`);
    else if (city) parts.push(city);
    else if (state) parts.push(state);
    if (neighborhood) parts.push(neighborhood);
    if (zone) parts.push(`Zona ${zone}`);
    if (bedrooms) parts.push(`${bedrooms} quartos`);
    if (valueMin || valueMax) {
      if (valueMin && valueMax) parts.push(`R$ ${valueMin} a R$ ${valueMax}`);
      else if (valueMin) parts.push(`a partir de R$ ${valueMin}`);
      else parts.push(`até R$ ${valueMax}`);
    }
    return parts.join(' - ');
  }, [selected, houseType, ruralType, operationType, city, state, neighborhood, zone, bedrooms, valueMin, valueMax]);

  const handleSubmit = async () => {
    if (!selected || !user) return;
    if (!city.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Informe a cidade.', variant: 'destructive' });
      return;
    }
    if (!operationType) {
      toast({ title: 'Campo obrigatório', description: 'Selecione o tipo de operação.', variant: 'destructive' });
      return;
    }
    if (selected.type === 'CASA' && !houseType) {
      toast({ title: 'Campo obrigatório', description: 'Selecione o tipo de casa.', variant: 'destructive' });
      return;
    }
    if (selected.type === 'RURAL' && !ruralType) {
      toast({ title: 'Campo obrigatório', description: 'Selecione o tipo de propriedade rural.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const config = fieldConfigs[selected.type];

    const { error } = await supabase.from('property_searches').insert({
      user_id: user.id,
      title: generatedTitle || null,
      headline: null,
      property_type: selected.type,
      operation_type: operationType,
      state: state.trim() || null,
      city: city.trim(),
      neighborhood: neighborhood.trim() || null,
      zone: zone.trim() || null,
      size_m2: sizeM2.trim() || null,
      bedrooms: config.hasBedrooms ? (bedrooms.trim() || null) : null,
      value: null,
      value_min: valueMin.trim() || null,
      value_max: valueMax.trim() || null,
      parking_spots: config.hasParking ? (parkingSpots.trim() || null) : null,
      observation: observation.trim() || null,
      house_type: selected.type === 'CASA' ? houseType : null,
      rural_type: selected.type === 'RURAL' ? ruralType : null,
    });

    setSaving(false);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar a procura.', variant: 'destructive' });
      return;
    }

    // Notify alert subscribers
    try {
      const { data: lastSearch } = await supabase
        .from('property_searches')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastSearch) {
        const { data: notifyResult, error: notifyError } = await supabase.functions.invoke('notify-alert-match', {
          body: {
            searchId: lastSearch.id,
            state: state.trim() || undefined,
            city: city.trim(),
            property_type: selected.type,
            operation_type: operationType,
            value_min: valueMin.trim() || undefined,
            value_max: valueMax.trim() || undefined,
            creatorUserId: user.id,
          },
        });
        if (notifyError) console.error('Alert notification error:', notifyError);
        else console.log('Alert notification result:', notifyResult);
      }
    } catch (e) {
      console.error('Alert notification error:', e);
    }

    // Notify WhatsApp group
    try {
      await supabase.functions.invoke('notify-group-new-search', {
        body: {
          state: state.trim() || undefined,
          city: city.trim(),
          operationType: operationType,
          propertyType: selected.type,
          zone: zone.trim() || undefined,
          neighborhood: neighborhood.trim() || undefined,
          valueMax: valueMax.trim() || undefined,
        },
      });
    } catch (e) {
      console.error('Group notification error:', e);
    }

    toast({ title: 'Procura adicionada!', description: 'Sua procura foi publicada com sucesso.' });
    navigate('/property-searches');
  };

  if (authLoading || !user) return null;

  // Step 1: select type
  if (!selected) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate('/property-searches')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Interesse do Comprador</h1>
          <p className="text-muted-foreground">Selecione o tipo de imóvel que você procura:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {typeOptions.map((opt, i) => (
              <Card
                key={i}
                className="cursor-pointer hover:shadow-md hover:border-primary transition-all text-center"
                onClick={() => setSelected(opt)}
              >
                <CardContent className="p-6 flex flex-col items-center gap-3">
                  <div className="text-primary">{opt.icon}</div>
                  <span className="font-medium text-sm text-foreground">{opt.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const config = fieldConfigs[selected.type];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setSelected(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Interesse do Comprador — {selected.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título gerado automaticamente */}
            {generatedTitle && (
              <div className="p-3 rounded-md bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Título gerado automaticamente:</p>
                <p className="text-sm font-medium text-foreground">{generatedTitle}</p>
              </div>
            )}

            {/* Sub-select for Casa */}
            {config.hasHouseType && (
              <div className="space-y-2">
                <Label>Tipo de Casa *</Label>
                <Select value={houseType} onValueChange={setHouseType}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RUA">Rua</SelectItem>
                    <SelectItem value="CONDOMINIO">Condomínio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sub-select for Rural */}
            {config.hasRuralType && (
              <div className="space-y-2">
                <Label>Tipo de Propriedade *</Label>
                <Select value={ruralType} onValueChange={setRuralType}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAZENDA">Fazenda</SelectItem>
                    <SelectItem value="SITIO">Sítio</SelectItem>
                    <SelectItem value="RANCHO">Rancho</SelectItem>
                    <SelectItem value="CHACARA">Chácara</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Estado via IBGE */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={state} onValueChange={handleStateChange}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingStates ? 'Carregando...' : 'Selecione o estado'} />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.sigla} value={s.sigla}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cidade via IBGE */}
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Select value={city} onValueChange={setCity} disabled={!state}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCities ? 'Carregando...' : !state ? 'Selecione o estado primeiro' : 'Selecione a cidade'} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Operação *</Label>
              <Select value={operationType} onValueChange={setOperationType}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {config.operationOptions.map((op) => (
                    <SelectItem key={op} value={op}>{opLabels[op]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bairro/Condomínio</Label>
              <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            </div>

            {/* Zona como Select */}
            <div className="space-y-2">
              <Label>Zona</Label>
              <Select value={zone} onValueChange={setZone}>
                <SelectTrigger><SelectValue placeholder="Selecione a zona" /></SelectTrigger>
                <SelectContent>
                  {zoneOptions.map((z) => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tamanho (m²)</Label>
                <Input value={sizeM2} onChange={(e) => setSizeM2(e.target.value)} />
              </div>
              {config.hasBedrooms && (
                <div className="space-y-2">
                  <Label>Quartos</Label>
                  <Input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                </div>
              )}
            </div>

            {/* Valor Mínimo e Máximo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Mínimo (R$)</Label>
                <Input
                  value={valueMin}
                  onChange={(e) => setValueMin(formatCurrency(e.target.value))}
                  placeholder="Ex: 200.000"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Máximo (R$)</Label>
                <Input
                  value={valueMax}
                  onChange={(e) => setValueMax(formatCurrency(e.target.value))}
                  placeholder="Ex: 500.000"
                />
              </div>
            </div>

            {config.hasParking && (
              <div className="space-y-2">
                <Label>Vagas de Garagem</Label>
                <Input value={parkingSpots} onChange={(e) => setParkingSpots(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={3} />
            </div>

            <Button onClick={handleSubmit} disabled={saving} className="w-full" size="lg">
              {saving ? 'Salvando...' : 'Adicionar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NewPropertySearch;
