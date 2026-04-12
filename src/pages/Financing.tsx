import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useIBGELocation } from '@/hooks/useIBGELocation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, DollarSign } from 'lucide-react';

const MODALITIES = [
  'Imóvel Novo',
  'Imóvel Usado',
  'Aquisição de Terreno e Construção',
  'Construção em Terreno Próprio',
  'Outro',
];

const formatCurrency = (value: string) => {
  const nums = value.replace(/\D/g, '');
  if (!nums) return '';
  const amount = parseInt(nums, 10) / 100;
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function Financing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { states, cities, fetchCities, clearCities } = useIBGELocation();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const [modality, setModality] = useState('');
  const [uf, setUf] = useState('');
  const [city, setCity] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [familyIncome, setFamilyIncome] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [useFgts, setUseFgts] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', user.id)
        .single();
      if (data) {
        setUserName(data.name || '');
        setUserPhone(data.phone || '');
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleUfChange = (val: string) => {
    setUf(val);
    setCity('');
    clearCities();
    fetchCities(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modality || !uf || !city || !propertyValue || !familyIncome || !birthDate || !useFgts) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-financing-whatsapp', {
        body: {
          modality,
          uf,
          city,
          propertyValue,
          familyIncome,
          birthDate,
          useFgts,
          userName,
          userPhone,
        },
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao enviar simulação', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Faça login para acessar esta página.</p>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-20 text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">Simulação Enviada!</h2>
          <p className="text-muted-foreground">
            Seus dados foram enviados para a Beltrami Capital. Em breve entrarão em contato.
          </p>
          <Button onClick={() => setSuccess(false)}>Enviar nova simulação</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Simulação de Financiamento
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Preencha os dados abaixo para enviar uma simulação de financiamento.
            </p>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <Select value={modality} onValueChange={setModality}>
                    <SelectTrigger><SelectValue placeholder="Selecione a modalidade" /></SelectTrigger>
                    <SelectContent>
                      {MODALITIES.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UF do Imóvel</Label>
                    <Select value={uf} onValueChange={handleUfChange}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s.sigla} value={s.sigla}>{s.sigla}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade do Imóvel</Label>
                    <Select value={city} onValueChange={setCity} disabled={!uf}>
                      <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Aproximado do Imóvel</Label>
                    <Input
                      placeholder="R$ 0,00"
                      value={propertyValue}
                      onChange={(e) => setPropertyValue(formatCurrency(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Renda Bruta Familiar Mensal</Label>
                    <Input
                      placeholder="R$ 0,00"
                      value={familyIncome}
                      onChange={(e) => setFamilyIncome(formatCurrency(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Nascimento (proponente mais velho)</Label>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Irá utilizar FGTS?</Label>
                    <Select value={useFgts} onValueChange={setUseFgts}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <p><strong>Corretor:</strong> {userName}</p>
                  <p><strong>Telefone:</strong> {userPhone}</p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar Simulação
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
