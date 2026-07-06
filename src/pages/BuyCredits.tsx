import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Coins, CreditCard, QrCode, Loader2, Star, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InputMask from 'react-input-mask';
import { useIsPaidSubscriber } from '@/hooks/useIsPaidSubscriber';

interface CreditPackage {
  id: string;
  name: string;
  price: number;
  credits: number;
  lead_count: number;
}

interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  address: string;
  addressNumber: string;
  complement: string;
  postalCode: string;
  province: string;
  city: string;
}

export default function BuyCredits() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'packages' | 'checkout'>('packages');
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '', email: '', cpfCnpj: '', phone: '',
    address: '', addressNumber: '', complement: '',
    postalCode: '', province: '', city: '',
  });

  const { user, loading: authLoading } = useAuth();
  const { isPaidSubscriber } = useIsPaidSubscriber();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Multiplicador: não-assinantes pagam 2x preço e recebem 2x créditos
  const mult = isPaidSubscriber ? 1 : 2;
  const effPrice = (p: number) => p * mult;
  const effCredits = (c: number) => c * mult;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    fetchPackages();
    loadUserData();
  }, [user, authLoading]);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('credits', { ascending: true });
    if (!error && data) setPackages(data);
    setLoading(false);
  };

  const loadUserData = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setCustomerData(prev => ({
        ...prev,
        name: data.name || '',
        phone: data.phone || '',
        email: user.email || '',
      }));
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const bestValueIdx = packages.length > 0
    ? packages.findIndex(pkg => pkg.credits === 1400)
    : -1;

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPackage(pkgId);
    setStep('checkout');
  };

  const handlePayment = async () => {
    if (!customerData.name.trim() || !customerData.email.trim() || !customerData.cpfCnpj.trim()) {
      toast({ title: 'Preencha nome, e-mail e CPF/CNPJ', variant: 'destructive' });
      return;
    }
    if (!customerData.phone.trim() || !customerData.address.trim() || !customerData.postalCode.trim() || !customerData.province.trim() || !customerData.city.trim()) {
      toast({ title: 'Preencha todos os campos de endereço', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-credit-purchase', {
        body: {
          packageId: selectedPackage,
          paymentMethod,
          customerData: {
            ...customerData,
            cpfCnpj: customerData.cpfCnpj.replace(/[^\d]/g, ''),
            phone: customerData.phone.replace(/[^\d]/g, ''),
            postalCode: customerData.postalCode.replace(/[^\d]/g, ''),
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error: any) {
      toast({ title: 'Erro ao processar', description: error.message, variant: 'destructive' });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (step === 'checkout') {
    const pkg = packages.find(p => p.id === selectedPackage);
    return (
      <Layout>
        <div className="max-w-2xl mx-auto pb-8">
          <Button variant="ghost" onClick={() => setStep('packages')} className="mb-4">
            ← Voltar aos pacotes
          </Button>
          <h1 className="text-2xl font-bold mb-2">Finalizar Compra de Créditos</h1>
          {pkg && (
            <Card className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{pkg.name}</p>
                  <p className="text-sm text-muted-foreground">{effCredits(pkg.credits)} créditos</p>
                </div>
                <p className="text-2xl font-bold text-primary">{formatPrice(effPrice(pkg.price))}</p>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card className="mb-6">
            <CardHeader><CardTitle>Método de Pagamento</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="grid grid-cols-2 gap-4">
                <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer ${paymentMethod === 'PIX' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="PIX" id="pix" />
                  <Label htmlFor="pix" className="cursor-pointer flex items-center gap-2">
                    <QrCode className="h-5 w-5" /> PIX
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer ${paymentMethod === 'CREDIT_CARD' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="CREDIT_CARD" id="card" />
                  <Label htmlFor="card" className="cursor-pointer flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> Cartão
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Customer Data */}
          <Card className="mb-6">
            <CardHeader><CardTitle>Dados para Cobrança</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome completo *</Label>
                  <Input value={customerData.name} onChange={(e) => setCustomerData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label>E-mail *</Label>
                  <Input value={customerData.email} onChange={(e) => setCustomerData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <Label>CPF/CNPJ *</Label>
                  <Input value={customerData.cpfCnpj} onChange={(e) => setCustomerData(p => ({ ...p, cpfCnpj: e.target.value }))} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label>Telefone *</Label>
                  <InputMask mask="(99) 99999-9999" value={customerData.phone} onChange={(e: any) => setCustomerData(p => ({ ...p, phone: e.target.value }))}>
                    {(inputProps: any) => <Input {...inputProps} />}
                  </InputMask>
                </div>
                <div className="md:col-span-2">
                  <Label>Endereço *</Label>
                  <Input value={customerData.address} onChange={(e) => setCustomerData(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div>
                  <Label>Número *</Label>
                  <Input value={customerData.addressNumber} onChange={(e) => setCustomerData(p => ({ ...p, addressNumber: e.target.value }))} />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input value={customerData.complement} onChange={(e) => setCustomerData(p => ({ ...p, complement: e.target.value }))} />
                </div>
                <div>
                  <Label>CEP *</Label>
                  <InputMask mask="99999-999" value={customerData.postalCode} onChange={(e: any) => setCustomerData(p => ({ ...p, postalCode: e.target.value }))}>
                    {(inputProps: any) => <Input {...inputProps} />}
                  </InputMask>
                </div>
                <div>
                  <Label>Bairro *</Label>
                  <Input value={customerData.province} onChange={(e) => setCustomerData(p => ({ ...p, province: e.target.value }))} />
                </div>
                <div>
                  <Label>Cidade *</Label>
                  <Input value={customerData.city} onChange={(e) => setCustomerData(p => ({ ...p, city: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handlePayment} disabled={processing} className="w-full" size="lg">
            {processing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            {processing ? 'Processando...' : `Pagar ${pkg ? formatPrice(effPrice(pkg.price)) : ''}`}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pb-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Comprar Créditos</h1>
          </div>
          <p className="text-muted-foreground">
            Adquira créditos para comprar leads instantaneamente.
          </p>
        </div>

        {!isPaidSubscriber && (
          <Card className="mb-6 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900 dark:text-yellow-200">
                  Assine o plano Essencial e ganhe 50% de desconto nos leads
                </p>
                <p className="text-yellow-800 dark:text-yellow-300">
                  <button
                    type="button"
                    onClick={() => navigate('/planos')}
                    className="underline font-semibold hover:opacity-80"
                  >
                    Ver planos
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, idx) => {
            const isBestValue = idx === bestValueIdx && packages.length > 2;
            return (
              <Card
                key={pkg.id}
                className={`relative flex flex-col hover:shadow-lg transition-all cursor-pointer border-2 ${
                  isBestValue ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-border hover:border-primary/40'
                }`}
                onClick={() => handleSelectPackage(pkg.id)}
              >
                {isBestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-yellow-500 hover:bg-yellow-500 text-black font-bold px-3">
                      <Star className="h-3 w-3 mr-1" /> Melhor custo-benefício
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-6">
                  <p className="text-3xl font-bold text-primary mt-2">{formatPrice(effPrice(pkg.price))}</p>
                </CardHeader>
                <CardContent className="flex-grow text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <Coins className="h-5 w-5" />
                    <span className="text-xl font-bold">{effCredits(pkg.credits).toLocaleString('pt-BR')} créditos</span>
                  </div>
                  <Button className="w-full mt-4" size="lg">
                    <Zap className="h-4 w-4 mr-2" />
                    Selecionar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
