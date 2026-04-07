import { useState } from 'react';
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
import { useEffect } from 'react';

type PropertyType = 'CASA' | 'APARTAMENTO' | 'SALA_COMERCIAL' | 'LOTE' | 'RURAL' | 'PREDIO_COMERCIAL';

interface TypeOption {
  type: PropertyType;
  label: string;
  icon: React.ReactNode;
  houseType?: string;
  ruralType?: string;
}

const typeOptions: TypeOption[] = [
  { type: 'CASA', label: 'Casa de Rua', icon: <Home className="h-8 w-8" />, houseType: 'RUA' },
  { type: 'CASA', label: 'Casa em Condomínio', icon: <Home className="h-8 w-8" />, houseType: 'CONDOMINIO' },
  { type: 'APARTAMENTO', label: 'Apartamento', icon: <Building2 className="h-8 w-8" /> },
  { type: 'SALA_COMERCIAL', label: 'Sala Comercial', icon: <Store className="h-8 w-8" /> },
  { type: 'LOTE', label: 'Lote', icon: <Landmark className="h-8 w-8" /> },
  { type: 'RURAL', label: 'Fazenda', icon: <TreePine className="h-8 w-8" />, ruralType: 'FAZENDA' },
  { type: 'RURAL', label: 'Sítio', icon: <TreePine className="h-8 w-8" />, ruralType: 'SITIO' },
  { type: 'RURAL', label: 'Rancho', icon: <TreePine className="h-8 w-8" />, ruralType: 'RANCHO' },
  { type: 'RURAL', label: 'Chácara', icon: <TreePine className="h-8 w-8" />, ruralType: 'CHACARA' },
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

const NewPropertySearch = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selected, setSelected] = useState<TypeOption | null>(null);
  const [saving, setSaving] = useState(false);

  // form fields
  const [city, setCity] = useState('');
  const [operationType, setOperationType] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zone, setZone] = useState('');
  const [sizeM2, setSizeM2] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [value, setValue] = useState('');
  const [parkingSpots, setParkingSpots] = useState('');
  const [observation, setObservation] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

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

    setSaving(true);
    const config = fieldConfigs[selected.type];

    const { error } = await supabase.from('property_searches').insert({
      user_id: user.id,
      property_type: selected.type,
      operation_type: operationType,
      city: city.trim(),
      neighborhood: neighborhood.trim() || null,
      zone: zone.trim() || null,
      size_m2: sizeM2.trim() || null,
      bedrooms: bedrooms.trim() || null,
      value: value.trim() || null,
      parking_spots: config.hasParking ? (parkingSpots.trim() || null) : null,
      observation: observation.trim() || null,
      house_type: selected.houseType ?? null,
      rural_type: selected.ruralType ?? null,
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
                <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ex: 350.000" />
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
