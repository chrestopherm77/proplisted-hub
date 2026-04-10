import { useState, useEffect } from 'react';
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
  hasRuralType: boolean;
  operationOptions: string[];
}

const fieldConfigs: Record<PropertyType, FieldConfig> = {
  CASA: { hasHouseType: true, hasParking: true, hasRuralType: false, operationOptions: ['VENDA', 'COMPRA'] },
  APARTAMENTO: { hasHouseType: false, hasParking: true, hasRuralType: false, operationOptions: ['VENDA', 'COMPRA', 'ALUGUEL'] },
  SALA_COMERCIAL: { hasHouseType: false, hasParking: true, hasRuralType: false, operationOptions: ['VENDA', 'ALUGUEL'] },
  LOTE: { hasHouseType: false, hasParking: false, hasRuralType: false, operationOptions: ['VENDA', 'ALUGUEL'] },
  RURAL: { hasHouseType: false, hasParking: false, hasRuralType: true, operationOptions: ['VENDA', 'ALUGUEL'] },
  PREDIO_COMERCIAL: { hasHouseType: false, hasParking: false, hasRuralType: false, operationOptions: ['VENDA', 'ALUGUEL'] },
};

const opLabels: Record<string, string> = { VENDA: 'Venda', COMPRA: 'Compra', ALUGUEL: 'Aluguel' };

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

  const [selected, setSelected] = useState<TypeOption | null>(null);
  const [saving, setSaving] = useState(false);

  // form fields
  const [title, setTitle] = useState('');
  const [headline, setHeadline] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [operationType, setOperationType] = useState('');
  const [houseType, setHouseType] = useState('');
  const [ruralType, setRuralType] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zone, setZone] = useState('');
  const [sizeM2, setSizeM2] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [value, setValue] = useState('');
  const [parkingSpots, setParkingSpots] = useState('');
  const [observation, setObservation] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate('/auth'); return; }
      if (isAdmin === false) { navigate('/'); return; }
    }
  }, [user, authLoading, isAdmin, navigate]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(formatCurrency(e.target.value));
  };

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
      title: title.trim() || null,
      headline: headline.trim() || null,
      property_type: selected.type,
      operation_type: operationType,
      state: state.trim() || null,
      city: city.trim(),
      neighborhood: neighborhood.trim() || null,
      zone: zone.trim() || null,
      size_m2: sizeM2.trim() || null,
      bedrooms: bedrooms.trim() || null,
      value: value.trim() || null,
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
          <h1 className="text-2xl font-bold text-foreground">Adicionar Procura</h1>
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
              Nova Procura — {selected.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título do Imóvel */}
            <div className="space-y-2">
              <Label>Título do Imóvel</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Casa 3 quartos no centro" />
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Ex: Procuro casa para compra em condomínio fechado" />
              <p className="text-xs text-muted-foreground">Descrição curta que aparecerá em destaque no card</p>
            </div>

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

            <div className="space-y-2">
              <Label>Estado</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Ex: MG" />
            </div>

            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Uberlândia" />
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

            <div className="space-y-2">
              <Label>Zona</Label>
              <Input value={zone} onChange={(e) => setZone(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tamanho (m²)</Label>
                <Input value={sizeM2} onChange={(e) => setSizeM2(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Quartos</Label>
                <Input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input value={value} onChange={handleValueChange} placeholder="Ex: 350.000" />
              </div>
              {config.hasParking && (
                <div className="space-y-2">
                  <Label>Vagas de Garagem</Label>
                  <Input value={parkingSpots} onChange={(e) => setParkingSpots(e.target.value)} />
                </div>
              )}
            </div>

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
